/**
 * ANALYTICS CONTROLLER - Analytics Metrics Handler
 * Provides endpoints for performance and accuracy analytics
 */

const { query } = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Get accuracy metrics
 * GET /api/analytics/accuracy?days=7
 */
async function getAccuracy(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 7;

    const metrics = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_queries,
        SUM(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) as resolved_queries,
        AVG(confidence_score) as avg_confidence,
        MIN(confidence_score) as min_confidence,
        MAX(confidence_score) as max_confidence,
        AVG(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) * 100 as accuracy_percentage
      FROM queries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);

    const overall = await query(`
      SELECT 
        COUNT(*) as total_queries,
        SUM(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) as resolved_queries,
        AVG(confidence_score) as avg_confidence,
        AVG(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) * 100 as overall_accuracy
      FROM queries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    res.status(200).json({
      success: true,
      period: `${days} days`,
      metrics: overall[0] || {},
      daily_breakdown: metrics
    });

  } catch (error) {
    logger.error('Error fetching accuracy metrics:', error);
    next(error);
  }
}

/**
 * Get query logs
 * GET /api/analytics/queries?limit=100&intent=course_info&resolved=true
 */
async function getQueries(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    const offset = parseInt(req.query.offset) || 0;
    const intent = req.query.intent;
    const resolved = req.query.resolved;

    let sql = `
      SELECT id, session_id, user_message, bot_response, intent_detected, 
             confidence_score, entities_extracted, response_time_ms, 
             was_resolved, feedback_rating, created_at
      FROM queries
      WHERE 1=1
    `;
    const params = [];

    if (intent) {
      sql += ` AND intent_detected = ?`;
      params.push(intent);
    }

    if (resolved !== undefined) {
      sql += ` AND was_resolved = ?`;
      params.push(resolved === 'true');
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const queries_result = await query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM queries WHERE 1=1`;
    const countParams = [];

    if (intent) {
      countSql += ` AND intent_detected = ?`;
      countParams.push(intent);
    }

    if (resolved !== undefined) {
      countSql += ` AND was_resolved = ?`;
      countParams.push(resolved === 'true');
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: queries_result,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching queries:', error);
    next(error);
  }
}

/**
 * Get intent distribution metrics
 * GET /api/analytics/intents
 */
async function getIntentMetrics(req, res, next) {
  try {
    const intents = await query(`
      SELECT 
        intent_detected,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence,
        SUM(CASE WHEN was_resolved = TRUE THEN 1 ELSE 0 END) as resolved_count,
        AVG(response_time_ms) as avg_response_time
      FROM queries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY intent_detected
      ORDER BY count DESC
    `);

    const totalQueries = intents.reduce((sum, item) => sum + item.count, 0);

    const distribution = intents.map(intent => ({
      ...intent,
      percentage: ((intent.count / totalQueries) * 100).toFixed(2)
    }));

    res.status(200).json({
      success: true,
      total_queries: totalQueries,
      unique_intents: intents.length,
      distribution
    });

  } catch (error) {
    logger.error('Error fetching intent metrics:', error);
    next(error);
  }
}

/**
 * Get performance metrics
 * GET /api/analytics/performance
 */
async function getPerformanceMetrics(req, res, next) {
  try {
    const metrics = await query(`
      SELECT 
        COUNT(*) as total_queries,
        AVG(response_time_ms) as avg_response_time,
        MIN(response_time_ms) as min_response_time,
        MAX(response_time_ms) as max_response_time,
        STDDEV(response_time_ms) as stddev_response_time,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) as p50_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time
      FROM queries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Fallback for MySQL that doesn't support PERCENTILE_CONT
    if (!metrics[0].p50_response_time) {
      const percentiles = await query(`
        SELECT 
          AVG(response_time_ms) as p50,
          MAX(response_time_ms) as p95
        FROM (
          SELECT response_time_ms FROM queries 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          ORDER BY response_time_ms LIMIT 50
        ) as p50_query;
      `);
    }

    res.status(200).json({
      success: true,
      performance: metrics[0] || {}
    });

  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    next(error);
  }
}

/**
 * Get daily analytics summary
 * GET /api/analytics/daily?days=7
 */
async function getDailyAnalytics(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 7;

    const analytics = await query(`
      SELECT 
        date,
        total_queries,
        resolved_queries,
        ROUND(accuracy_rate * 100, 2) as accuracy_percentage,
        avg_confidence,
        avg_response_time_ms,
        unique_sessions
      FROM analytics_daily
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY date DESC
    `, [days]);

    // Calculate summary stats
    const summary = {
      total_queries: analytics.reduce((sum, day) => sum + day.total_queries, 0),
      avg_accuracy: (analytics.reduce((sum, day) => sum + parseFloat(day.accuracy_percentage), 0) / analytics.length).toFixed(2),
      avg_response_time: (analytics.reduce((sum, day) => sum + day.avg_response_time_ms, 0) / analytics.length).toFixed(0),
      total_sessions: analytics.reduce((sum, day) => sum + day.unique_sessions, 0)
    };

    res.status(200).json({
      success: true,
      summary,
      daily: analytics
    });

  } catch (error) {
    logger.error('Error fetching daily analytics:', error);
    next(error);
  }
}

module.exports = {
  getAccuracy,
  getQueries,
  getIntentMetrics,
  getPerformanceMetrics,
  getDailyAnalytics
};
