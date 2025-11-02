/**
 * RATE LIMITER - API Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * Rate limiter for API endpoints
 */
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

/**
 * Strict rate limiter for sensitive endpoints (e.g., feedback)
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many requests to this endpoint. Please slow down.'
  }
});

module.exports = {
  rateLimiter,
  strictRateLimiter
};
