/**
 * Redis caching utility functions
 * Provides a simple interface for caching with automatic fallback if Redis is unavailable
 */

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 */
const initRedis = async () => {
  // Only initialize if REDIS_URL is provided
  if (!process.env.REDIS_URL) {
    console.log('⚠️  Redis URL not configured, caching disabled');
    return;
  }

  try {
    const redis = require('redis');
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    isRedisAvailable = false;
  }
};

/**
 * Get value from cache
 */
const get = async (key) => {
  if (!isRedisAvailable || !redisClient) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Set value in cache with TTL
 */
const set = async (key, value, ttlSeconds = 300) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete value from cache
 */
const del = async (key) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Cache DEL error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete all keys matching a pattern
 */
const delPattern = async (pattern) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`Cache DEL pattern error for ${pattern}:`, error.message);
    return false;
  }
};

/**
 * Cache middleware wrapper
 * Usage: router.get('/products', cacheMiddleware('products:all', 300), handler)
 */
const cacheMiddleware = (keyOrFunction, ttl = 300) => {
  return async (req, res, next) => {
    // Generate cache key
    const cacheKey = typeof keyOrFunction === 'function' 
      ? keyOrFunction(req) 
      : keyOrFunction;

    // Try to get from cache
    const cached = await get(cacheKey);
    if (cached) {
      console.log(`✨ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    console.log(`💾 Cache MISS: ${cacheKey}`);

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (data) => {
      set(cacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for specific resource
 */
const clearResourceCache = async (resource) => {
  await delPattern(`${resource}:*`);
  console.log(`🗑️  Cleared cache for: ${resource}`);
};

module.exports = {
  initRedis,
  get,
  set,
  del,
  delPattern,
  cacheMiddleware,
  clearResourceCache,
};

