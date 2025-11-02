/**
 * NLP SERVICE - Natural Language Processing Pipeline
 * Orchestrates intent classification and entity extraction
 */

const { classifyIntent, extractEntities } = require('../config/nlp');
const { logger } = require('../utils/logger');
const { cacheGet, cacheSet } = require('../utils/cache');

/**
 * Process user message through NLP pipeline
 * @param {string} message - User input message
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} NLP processing result
 */
async function processMessage(message, context = {}) {
  const startTime = Date.now();

  try {
    // Check cache first for identical queries
    const cacheKey = `nlp:${message.toLowerCase().trim()}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      logger.debug('NLP result retrieved from cache');
      return JSON.parse(cached);
    }

    // Step 1: Classify intent
    logger.debug('Classifying intent...');
    const intentResult = await classifyIntent(message);
    
    // Step 2: Extract entities
    logger.debug('Extracting entities...');
    const entities = extractEntities(message);
    
    // Step 3: Enhance with context if available
    const enhancedResult = {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      entities: enhanceEntitiesWithContext(entities, context),
      context: context,
      processing_time_ms: Date.now() - startTime,
      method: intentResult.method || 'hybrid'
    };

    // Cache result for 1 hour
    await cacheSet(cacheKey, JSON.stringify(enhancedResult), 3600);

    logger.info(`NLP processing complete: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(1)}%)`);
    
    return enhancedResult;

  } catch (error) {
    logger.error('NLP processing failed:', error);
    
    // Return fallback result
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
      context: context,
      processing_time_ms: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Enhance entities with conversation context
 * @param {Object} entities - Extracted entities
 * @param {Object} context - Conversation context
 * @returns {Object} Enhanced entities
 */
function enhanceEntitiesWithContext(entities, context) {
  const enhanced = { ...entities };

  // If no course code found but context has last_course, use it
  if ((!enhanced.course_codes || enhanced.course_codes.length === 0) && context.last_course) {
    enhanced.course_codes = [context.last_course];
    enhanced.from_context = true;
  }

  // If no instructor name but context has last_instructor
  if ((!enhanced.instructor_names || enhanced.instructor_names.length === 0) && context.last_instructor) {
    enhanced.instructor_names = [context.last_instructor];
    enhanced.from_context = true;
  }

  // Normalize course codes to uppercase
  if (enhanced.course_codes) {
    enhanced.course_codes = enhanced.course_codes.map(code => code.toUpperCase());
  }

  // Normalize department names
  if (enhanced.departments) {
    enhanced.departments = enhanced.departments.map(dept => 
      normalizedDepartmentName(dept)
    );
  }

  return enhanced;
}

/**
 * Normalize department names
 * @param {string} dept - Department name
 * @returns {string} Normalized name
 */
function normalizedDepartmentName(dept) {
  const mapping = {
    'cs': 'Computer Science',
    'computer science': 'Computer Science',
    'math': 'Mathematics',
    'mathematics': 'Mathematics',
    'eng': 'English',
    'english': 'English',
    'phy': 'Physics',
    'physics': 'Physics',
    'bus': 'Business',
    'business': 'Business',
    'chem': 'Chemistry',
    'chemistry': 'Chemistry',
    'bio': 'Biology',
    'biology': 'Biology'
  };

  return mapping[dept.toLowerCase()] || dept;
}

/**
 * Validate extracted entities
 * @param {Object} entities - Extracted entities
 * @param {string} intent - Detected intent
 * @returns {Object} Validation result
 */
function validateEntities(entities, intent) {
  const validation = {
    isValid: true,
    missingEntities: [],
    warnings: []
  };

  // Define required entities for each intent
  const requiredEntities = {
    'course_info': ['course_codes'],
    'course_schedule': ['course_codes'],
    'course_prerequisites': ['course_codes'],
    'instructor_info': ['instructor_names'],
    'instructor_office_hours': ['instructor_names'],
    'course_availability': ['course_codes'],
    'course_location': ['course_codes'],
    'course_credits': ['course_codes']
  };

  const required = requiredEntities[intent] || [];

  for (const entityType of required) {
    if (!entities[entityType] || entities[entityType].length === 0) {
      validation.isValid = false;
      validation.missingEntities.push(entityType);
    }
  }

  // Warnings for ambiguous entities
  if (entities.course_codes && entities.course_codes.length > 1) {
    validation.warnings.push('Multiple course codes detected. Using first one.');
  }

  if (entities.instructor_names && entities.instructor_names.length > 1) {
    validation.warnings.push('Multiple instructor names detected. Using first one.');
  }

  return validation;
}

/**
 * Get intent confidence level description
 * @param {number} confidence - Confidence score
 * @returns {string} Confidence level
 */
function getConfidenceLevel(confidence) {
  if (confidence >= 0.9) return 'very_high';
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.6) return 'medium';
  if (confidence >= 0.4) return 'low';
  return 'very_low';
}

/**
 * Batch process multiple messages
 * @param {Array<string>} messages - Array of messages
 * @returns {Promise<Array<Object>>} Array of NLP results
 */
async function batchProcessMessages(messages) {
  try {
    const results = await Promise.all(
      messages.map(message => processMessage(message))
    );
    return results;
  } catch (error) {
    logger.error('Batch processing failed:', error);
    throw error;
  }
}

/**
 * Get NLP statistics
 * @returns {Promise<Object>} Statistics
 */
async function getStatistics() {
  try {
    const { query } = require('../config/database');
    
    const stats = await query(`
      SELECT 
        intent_detected,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence,
        MIN(confidence_score) as min_confidence,
        MAX(confidence_score) as max_confidence
      FROM queries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY intent_detected
      ORDER BY count DESC
    `);

    return {
      intents: stats,
      total: stats.reduce((sum, item) => sum + item.count, 0)
    };
  } catch (error) {
    logger.error('Failed to get NLP statistics:', error);
    throw error;
  }
}

module.exports = {
  processMessage,
  validateEntities,
  getConfidenceLevel,
  batchProcessMessages,
  getStatistics,
  enhanceEntitiesWithContext
};
