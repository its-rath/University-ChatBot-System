/**
 * CHAT CONTROLLER - Main Chatbot Logic
 * Handles incoming chat requests and generates responses
 */

const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const nlpService = require('../services/nlpService');
const responseGenerator = require('../services/responseGenerator');
const { query } = require('../config/database');
const { cacheGet, cacheSet } = require('../utils/cache');

/**
 * Process chat message
 * POST /api/chat
 */
async function processMessage(req, res, next) {
  const startTime = Date.now();
  let sessionId = req.body.session_id || req.headers['x-session-id'] || uuidv4();
  
  try {
    const { message, context } = req.body;
    
    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1000 characters allowed.'
      });
    }

    logger.info(`Processing message for session: ${sessionId}`);
    logger.debug(`User message: ${message}`);

    // Step 1: Process message through NLP pipeline
    const nlpResult = await nlpService.processMessage(message, context);
    
    logger.info(`Intent detected: ${nlpResult.intent} (confidence: ${nlpResult.confidence.toFixed(4)})`);

    // Step 2: Generate response based on intent and entities
    const responseData = await responseGenerator.generateResponse(
      nlpResult.intent,
      nlpResult.entities,
      nlpResult.confidence
    );

    const responseTime = Date.now() - startTime;

    // Step 3: Log query to database
    const wasResolved = nlpResult.confidence >= 0.75 && responseData.success;
    
    await query(
      `INSERT INTO queries 
       (session_id, user_message, bot_response, intent_detected, confidence_score, 
        entities_extracted, response_time_ms, was_resolved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        message,
        responseData.response,
        nlpResult.intent,
        nlpResult.confidence,
        JSON.stringify(nlpResult.entities),
        responseTime,
        wasResolved
      ]
    );

    // Step 4: Return response
    res.status(200).json({
      success: true,
      session_id: sessionId,
      response: responseData.response,
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      data: responseData.data || null,
      response_time_ms: responseTime,
      suggestions: responseData.suggestions || []
    });

    logger.info(`Response sent in ${responseTime}ms`);

  } catch (error) {
    logger.error('Error processing message:', error);
    
    const responseTime = Date.now() - startTime;

    // Log failed query
    try {
      await query(
        `INSERT INTO queries 
         (session_id, user_message, bot_response, intent_detected, confidence_score, 
          response_time_ms, was_resolved) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          req.body.message || '',
          'An error occurred processing your request.',
          'error',
          0,
          responseTime,
          false
        ]
      );
    } catch (logError) {
      logger.error('Failed to log error query:', logError);
    }

    next(error);
  }
}

/**
 * Get conversation history
 * GET /api/chat/history/:sessionId
 */
async function getHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Check cache first
    const cacheKey = `history:${sessionId}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return res.status(200).json({
        success: true,
        session_id: sessionId,
        history: JSON.parse(cached),
        from_cache: true
      });
    }

    // Fetch from database
    const history = await query(
      `SELECT 
        id, user_message, bot_response, intent_detected, 
        confidence_score, entities_extracted, created_at
       FROM queries
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [sessionId, limit]
    );

    // Cache for 5 minutes
    await cacheSet(cacheKey, JSON.stringify(history), 300);

    res.status(200).json({
      success: true,
      session_id: sessionId,
      history: history.reverse(),
      count: history.length
    });

  } catch (error) {
    logger.error('Error fetching history:', error);
    next(error);
  }
}

/**
 * Submit feedback for a query
 * POST /api/chat/feedback
 */
async function submitFeedback(req, res, next) {
  try {
    const { query_id, rating, comment } = req.body;

    if (!query_id || !rating) {
      return res.status(400).json({
        success: false,
        error: 'query_id and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Insert feedback
    await query(
      `INSERT INTO feedback (query_id, rating, comment) VALUES (?, ?, ?)`,
      [query_id, rating, comment || null]
    );

    // Update query feedback rating
    await query(
      `UPDATE queries SET feedback_rating = ? WHERE id = ?`,
      [rating, query_id]
    );

    logger.info(`Feedback submitted for query ${query_id}: ${rating}/5`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    next(error);
  }
}

/**
 * Clear conversation history
 * DELETE /api/chat/history/:sessionId
 */
async function clearHistory(req, res, next) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Delete from database
    const result = await query(
      `DELETE FROM queries WHERE session_id = ?`,
      [sessionId]
    );

    // Clear cache
    const cacheKey = `history:${sessionId}`;
    await cacheSet(cacheKey, null, 0);

    res.status(200).json({
      success: true,
      message: 'History cleared successfully',
      deleted_count: result.affectedRows
    });

  } catch (error) {
    logger.error('Error clearing history:', error);
    next(error);
  }
}

module.exports = {
  processMessage,
  getHistory,
  submitFeedback,
  clearHistory
};
