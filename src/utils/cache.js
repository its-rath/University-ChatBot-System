/**
 * CACHE - Redis Cache Utility
 * Provides caching functionality using Redis
 */

const redis = require('redis');
const { logger } = require('./logger');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
async function initializeCache() {
  try {
    const redisHost = process.env.NODE_ENV === 'production'
      ? process.env.DOCKER_REDIS_HOST
      : process.env.REDIS_HOST;

    redisClient = redis.createClient({
      socket: {
        host: redisHost || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      },
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis client disconnected');
      isConnected = false;
    });

    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis cache:', error);
    // Don't throw error - app can work without cache
    isConnected = false;
    return null;
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} Cached value or null
 */
async function cacheGet(key) {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug(`Cache hit: ${key}`);
    }
    return value;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {string} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<boolean>} Success status
 */
async function cacheSet(key, value, ttl = 3600) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    if (ttl > 0) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.del(key);
    }
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function cacheDelete(key) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    logger.debug(`Cache deleted: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Check if key exists in cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Existence status
 */
async function cacheExists(key) {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Cache exists check error for key ${key}:`, error);
    return false;
  }
}

/**
 * Clear all cache
 * @returns {Promise<boolean>} Success status
 */
async function cacheClear() {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.flushDb();
    logger.info('Cache cleared');
    return true;
  } catch (error) {
    logger.error('Cache clear error:', error);
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache stats
 */
async function cacheStats() {
  if (!isConnected || !redisClient) {
    return { connected: false };
  }

  try {
    const info = await redisClient.info('stats');
    const keyspace = await redisClient.info('keyspace');
    
    return {
      connected: true,
      info,
      keyspace
    };
  } catch (error) {
    logger.error('Cache stats error:', error);
    return { connected: false, error: error.message };
  }
}

/**
 * Ping cache to check connection
 * @returns {Promise<boolean>} Connection status
 */
async function ping() {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    const response = await redisClient.ping();
    return response === 'PONG';
  } catch (error) {
    logger.error('Cache ping error:', error);
    return false;
  }
}

/**
 * Close Redis connection
 */
async function closeCache() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

/**
 * Get cache key with prefix
 * @param {string} key - Key name
 * @returns {string} Prefixed key
 */
function getCacheKey(key) {
  const prefix = process.env.CACHE_PREFIX || 'chatbot';
  return `${prefix}:${key}`;
}

module.exports = {
  initializeCache,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheExists,
  cacheClear,
  cacheStats,
  ping,
  closeCache,
  getCacheKey
};
