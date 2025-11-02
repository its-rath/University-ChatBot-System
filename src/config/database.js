/**
 * DATABASE.JS - MySQL Database Configuration
 * Handles database connection pooling and query execution
 */

const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

let pool = null;

/**
 * Database configuration
 */
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

/**
 * Initialize database connection pool
 */
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    logger.info('Database connection pool created successfully');
    
    // Set up connection error handlers
    pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });
    
    return pool;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database connection pool
 */
function getConnection() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute query with automatic connection handling
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  const startTime = Date.now();
  
  try {
    const [results] = await pool.execute(sql, params);
    
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000) {
      logger.warn(`Slow query detected (${duration}ms):`, sql);
    }
    
    if (process.env.ENABLE_QUERY_LOGGING === 'true' && process.env.NODE_ENV === 'development') {
      logger.debug(`Query executed (${duration}ms):`, sql.substring(0, 100));
    }
    
    return results;
  } catch (error) {
    logger.error('Query execution failed:', { sql, error: error.message });
    throw error;
  }
}

/**
 * Execute query with transaction support
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close database connection pool
 */
async function closeDatabase() {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database pool:', error);
      throw error;
    }
  }
}

/**
 * Check database health
 */
async function healthCheck() {
  try {
    await query('SELECT 1');
    return { status: 'healthy', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

module.exports = {
  initializeDatabase,
  getConnection,
  query,
  transaction,
  closeDatabase,
  healthCheck
};
