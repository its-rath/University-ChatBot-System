/**
 * NLP.JS - Natural Language Processing Configuration
 * Initializes and manages NLP models for intent classification and entity extraction
 */

const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const compromise = require('compromise');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

// Tokenizer for text preprocessing
const tokenizer = new natural.WordTokenizer();

// Stemmer for word normalization
const stemmer = natural.PorterStemmer;

// TF-IDF for feature extraction
let tfidf = null;

// Intent classification model
let intentModel = null;

// Word index mapping
let wordIndex = {};

// Intent label mapping
let intentLabels = {};

// Configuration
const config = {
  modelPath: process.env.NLP_MODEL_PATH || './nlp/models/intent_classifier',
  confidenceThreshold: parseFloat(process.env.NLP_CONFIDENCE_THRESHOLD) || 0.75,
  maxSequenceLength: parseInt(process.env.NLP_MAX_SEQUENCE_LENGTH) || 50,
  embeddingDim: 100,
  vocabularySize: 10000
};

/**
 * Initialize NLP models and components
 */
async function initializeNLP() {
  try {
    logger.info('Initializing NLP components...');

    // Initialize TF-IDF
    tfidf = new natural.TfIdf();

    // Load pre-trained model if exists, otherwise use rule-based system
    if (fs.existsSync(path.join(config.modelPath, 'model.json'))) {
      logger.info('Loading pre-trained intent classification model...');
      intentModel = await tf.loadLayersModel(`file://${path.join(config.modelPath, 'model.json')}`);
      
      // Load word index and intent labels
      wordIndex = JSON.parse(fs.readFileSync(path.join(config.modelPath, 'word_index.json'), 'utf8'));
      intentLabels = JSON.parse(fs.readFileSync(path.join(config.modelPath, 'intent_labels.json'), 'utf8'));
      
      logger.info(`Model loaded with ${Object.keys(intentLabels).length} intent classes`);
    } else {
      logger.warn('No pre-trained model found. Using rule-based classification.');
      logger.info('Run "npm run train:nlp" to train the model.');
    }

    logger.info('NLP initialization complete');
    return true;
  } catch (error) {
    logger.error('Failed to initialize NLP:', error);
    // Don't throw error - fallback to rule-based system
    return false;
  }
}

/**
 * Preprocess text for NLP processing
 * @param {string} text - Input text
 * @returns {Object} Preprocessed text data
 */
function preprocessText(text) {
  if (!text || typeof text !== 'string') {
    return {
      original: '',
      lowercased: '',
      tokens: [],
      stemmed: [],
      normalized: ''
    };
  }

  const lowercased = text.toLowerCase().trim();
  const tokens = tokenizer.tokenize(lowercased);
  const stemmed = tokens.map(token => stemmer.stem(token));
  const normalized = stemmed.join(' ');

  return {
    original: text,
    lowercased,
    tokens,
    stemmed,
    normalized
  };
}

/**
 * Convert text to sequence of indices for model input
 * @param {string} text - Input text
 * @returns {Array<number>} Sequence of word indices
 */
function textToSequence(text) {
  const preprocessed = preprocessText(text);
  const sequence = preprocessed.tokens
    .map(token => wordIndex[token] || 0)
    .slice(0, config.maxSequenceLength);
  
  // Pad sequence to fixed length
  while (sequence.length < config.maxSequenceLength) {
    sequence.push(0);
  }
  
  return sequence;
}

/**
 * Classify intent using deep learning model
 * @param {string} text - Input text
 * @returns {Promise<Object>} Intent classification result
 */
async function classifyIntentML(text) {
  if (!intentModel) {
    throw new Error('Intent model not loaded');
  }

  try {
    const sequence = textToSequence(text);
    const inputTensor = tf.tensor2d([sequence], [1, config.maxSequenceLength]);
    
    const prediction = await intentModel.predict(inputTensor);
    const probabilities = await prediction.data();
    
    // Find highest probability intent
    let maxProb = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }
    
    const intentName = Object.keys(intentLabels).find(
      key => intentLabels[key] === maxIndex
    );
    
    // Cleanup tensors
    inputTensor.dispose();
    prediction.dispose();
    
    return {
      intent: intentName,
      confidence: maxProb,
      allProbabilities: probabilities
    };
  } catch (error) {
    logger.error('ML intent classification failed:', error);
    throw error;
  }
}

/**
 * Rule-based intent classification (fallback)
 * @param {string} text - Input text
 * @returns {Object} Intent classification result
 */
function classifyIntentRuleBased(text) {
  const lowercased = text.toLowerCase();
  const doc = compromise(text);

  // Intent patterns
  const patterns = {
    greeting: /^(hi|hello|hey|good morning|good afternoon|greetings)/i,
    thanks: /(thank|thanks|appreciate)/i,
    help: /(help|assist|support|guide|what can you do)/i,
    course_info: /(what is|tell me about|information about|describe|explain).*(course|class)/i,
    course_schedule: /(when|what time|schedule|timing).*(course|class)|when is (cs|math|eng|phy|bus)\d+/i,
    course_prerequisites: /(prerequisite|prereq|requirement|need to take|before taking)/i,
    instructor_info: /(who teaches|professor|instructor|faculty).*(teach|offer|information)/i,
    instructor_office_hours: /(office hours|when.*available|meet with|visit)/i,
    course_availability: /(available|open|seats|full|enrollment|can i enroll)/i,
    course_location: /(where|location|room|building).*(held|meet|class)/i,
    course_credits: /(how many credits|credit hours|worth)/i,
    department_courses: /(what courses|list.*courses|courses in).*(department|major)/i
  };

  // Check patterns
  for (const [intent, pattern] of Object.entries(patterns)) {
    if (pattern.test(lowercased)) {
      // Calculate confidence based on match quality
      const confidence = intent === 'greeting' || intent === 'thanks' ? 0.95 : 0.85;
      return {
        intent,
        confidence,
        method: 'rule-based'
      };
    }
  }

  // Default fallback
  return {
    intent: 'unknown',
    confidence: 0.3,
    method: 'rule-based'
  };
}

/**
 * Main intent classification function
 * @param {string} text - Input text
 * @returns {Promise<Object>} Intent classification result
 */
async function classifyIntent(text) {
  try {
    // Try ML model first if available
    if (intentModel) {
      const result = await classifyIntentML(text);
      
      // Fallback to rule-based if confidence is too low
      if (result.confidence < config.confidenceThreshold) {
        logger.debug('ML confidence too low, trying rule-based classification');
        const ruleBasedResult = classifyIntentRuleBased(text);
        
        // Use rule-based if it has higher confidence
        if (ruleBasedResult.confidence > result.confidence) {
          return ruleBasedResult;
        }
      }
      
      return result;
    } else {
      // Use rule-based classification
      return classifyIntentRuleBased(text);
    }
  } catch (error) {
    logger.error('Intent classification failed:', error);
    // Final fallback
    return classifyIntentRuleBased(text);
  }
}

/**
 * Extract entities from text using compromise
 * @param {string} text - Input text
 * @returns {Object} Extracted entities
 */
function extractEntities(text) {
  const doc = compromise(text);
  
  const entities = {
    course_codes: [],
    instructor_names: [],
    departments: [],
    times: [],
    days: [],
    semesters: [],
    numbers: []
  };

  // Extract course codes (e.g., CS101, MATH201)
  const courseCodePattern = /\b[A-Z]{2,4}\d{3}\b/g;
  const courseCodes = text.match(courseCodePattern);
  if (courseCodes) {
    entities.course_codes = courseCodes;
  }

  // Extract person names (potential instructors)
  const people = doc.people().out('array');
  if (people.length > 0) {
    entities.instructor_names = people;
  }

  // Extract times
  const times = doc.times().out('array');
  if (times.length > 0) {
    entities.times = times;
  }

  // Extract dates and days
  const dates = doc.dates().out('array');
  if (dates.length > 0) {
    entities.days = dates;
  }

  // Extract numbers
  const numbers = doc.numbers().out('array');
  if (numbers.length > 0) {
    entities.numbers = numbers;
  }

  // Extract semesters
  const semesterPattern = /(spring|fall|summer|winter)\s*\d{4}/gi;
  const semesters = text.match(semesterPattern);
  if (semesters) {
    entities.semesters = semesters;
  }

  // Extract departments (common ones)
  const deptPattern = /\b(computer science|mathematics|math|english|physics|business|chemistry|biology)\b/gi;
  const departments = text.match(deptPattern);
  if (departments) {
    entities.departments = [...new Set(departments.map(d => d.toLowerCase()))];
  }

  return entities;
}

/**
 * Get NLP configuration
 */
function getConfig() {
  return { ...config };
}

module.exports = {
  initializeNLP,
  preprocessText,
  classifyIntent,
  extractEntities,
  textToSequence,
  getConfig
};
