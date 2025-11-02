/**
 * SERVER.JS - Application Entry Point
 * University Intelligent Chatbot System
 * 
 * Main server file that initializes and starts the Express application
 */

require('dotenv').config();
const app = require('./src/app');
const { logger } = require('./src/utils/logger');
const { initializeDatabase } = require('./src/config/database');
const { initializeNLP } = require('./src/config/nlp');
const { initializeCache } = require('./src/utils/cache');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Initialize all services before starting server
 */
async function initializeServices() {
  try {
    logger.info('🚀 Initializing services...');

    // Initialize database connection
    logger.info('📦 Connecting to MySQL database...');
    await initializeDatabase();
    logger.info('✅ Database connection established');

    // Initialize cache (Redis)
    logger.info('🔄 Connecting to Redis cache...');
    await initializeCache();
    logger.info('✅ Cache connection established');

    // Initialize NLP models
    logger.info('🧠 Loading NLP models...');
    await initializeNLP();
    logger.info('✅ NLP models loaded successfully');

    logger.info('✨ All services initialized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Start the Express server
 */
async function startServer() {
  try {
    // Initialize all services first
    await initializeServices();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`🎓 University Chatbot Server`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 API Base URL: http://localhost:${PORT}/api`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
      logger.info('='.repeat(50));
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        try {
          // Close database connections
          const db = require('./src/config/database');
          await db.closeDatabase();
          logger.info('✅ Database connections closed');

          // Close Redis connection
          const cache = require('./src/utils/cache');
          await cache.closeCache();
          logger.info('✅ Cache connection closed');

          logger.info('👋 Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
