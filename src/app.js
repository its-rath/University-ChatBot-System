/**
 * APP.JS - Express Application Setup
 * Configures Express middleware, routes, and error handling
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { logger, stream } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

// Import routes
const chatRoutes = require('./routes/chatRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Create Express app
const app = express();

// ===================================
// SECURITY MIDDLEWARE
// ===================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ===================================
// CORS CONFIGURATION
// ===================================
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ===================================
// GENERAL MIDDLEWARE
// ===================================
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream }));
} else {
  app.use(morgan('combined', { stream }));
}

// ===================================
// RATE LIMITING
// ===================================
app.use('/api', rateLimiter);

// ===================================
// HEALTH CHECK ENDPOINT
// ===================================
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'OK',
      cache: 'OK',
      nlp: 'OK'
    }
  };

  try {
    // Check database connection
    const db = require('./config/database');
    await db.getConnection().ping();

    // Check cache connection
    const cache = require('./utils/cache');
    await cache.ping();

    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = 'ERROR';
    healthCheck.services.database = error.message.includes('database') ? 'ERROR' : 'OK';
    healthCheck.services.cache = error.message.includes('cache') ? 'ERROR' : 'OK';
    
    logger.error('Health check failed:', error);
    res.status(503).json(healthCheck);
  }
});

// ===================================
// API ROUTES
// ===================================
const API_PREFIX = process.env.API_PREFIX || '/api';

app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'University Chatbot API',
    version: '1.0.0',
    endpoints: {
      health: `${API_PREFIX}/health`,
      chat: `${API_PREFIX}/chat`,
      analytics: `${API_PREFIX}/analytics`
    },
    documentation: 'See /docs/API.md for complete documentation'
  });
});

// ===================================
// 404 HANDLER
// ===================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ===================================
// GLOBAL ERROR HANDLER
// ===================================
app.use(errorHandler);

module.exports = app;
