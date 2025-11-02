/**
 * CHAT ROUTES - Chatbot API Endpoints
 * Defines all chat-related routes and handlers
 */

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { strictRateLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/chat
 * Main chat endpoint - process user message
 */
router.post('/', asyncHandler(chatController.processMessage));

/**
 * GET /api/chat/history/:sessionId
 * Get conversation history for a session
 */
router.get('/history/:sessionId', asyncHandler(chatController.getHistory));

/**
 * DELETE /api/chat/history/:sessionId
 * Clear conversation history for a session
 */
router.delete('/history/:sessionId', asyncHandler(chatController.clearHistory));

/**
 * POST /api/chat/feedback
 * Submit feedback for a query
 */
router.post('/feedback', strictRateLimiter, asyncHandler(chatController.submitFeedback));

module.exports = router;
