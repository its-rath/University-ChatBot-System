/**
 * ANALYTICS ROUTES - Analytics and Metrics Endpoints
 * Provides endpoints for accessing performance metrics and query analytics
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/analytics/accuracy
 * Get accuracy metrics over time period
 */
router.get('/accuracy', asyncHandler(analyticsController.getAccuracy));

/**
 * GET /api/analytics/queries
 * Get query logs with filtering
 */
router.get('/queries', asyncHandler(analyticsController.getQueries));

/**
 * GET /api/analytics/intents
 * Get intent distribution metrics
 */
router.get('/intents', asyncHandler(analyticsController.getIntentMetrics));

/**
 * GET /api/analytics/performance
 * Get system performance metrics
 */
router.get('/performance', asyncHandler(analyticsController.getPerformanceMetrics));

/**
 * GET /api/analytics/daily
 * Get daily analytics summary
 */
router.get('/daily', asyncHandler(analyticsController.getDailyAnalytics));

module.exports = router;
