const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

// Helper to create RedisStore using existing Redis client connection (src/config/redis.js)
const createRedisStore = (prefix) => {
  if (redisClient && (typeof redisClient.call === "function" || typeof redisClient.sendCommand === "function")) {
    return new RedisStore({
      sendCommand: (...args) => {
        if (typeof redisClient.call === "function") {
          return redisClient.call(...args);
        }
        return redisClient.sendCommand(...args);
      },
      prefix: `rl:${prefix}:`,
    });
  } else {
    logger.warn(`⚠️ Redis client not available for rate limiter [${prefix}] — falling back to per-process MemoryStore. Distributed rate limiting is INACTIVE.`);
    return undefined; // Fallback to MemoryStore
  }
};

const userKeyGenerator = (req) => req.user?.userId || req.ip || req.headers['x-forwarded-for'];

const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || !process.env.NODE_ENV;

// General API rate limiter (200 requests per 15 mins in prod, 10000 in dev)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  // Fail open: if Redis is down or out of quota, don't turn requests into 500s.
  passOnStoreError: true,
  store: createRedisStore("api"),
  message: {
    success: false,
    message: "Too many requests from this client. Please try again later.",
  },
});

// Strict auth rate limiter for login / register / OTP endpoints (10 requests per 15 mins in prod, 10000 in dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  // Fail open: if Redis is down or out of quota, don't turn requests into 500s.
  passOnStoreError: true,
  store: createRedisStore("auth"),
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

// Booking rate limiter for appointment creation (30 requests per 15 mins in prod, 10000 in dev)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  // Fail open: if Redis is down or out of quota, don't turn requests into 500s.
  passOnStoreError: true,
  store: createRedisStore("booking"),
  message: {
    success: false,
    message: "Too many booking requests. Please wait a moment before trying again.",
  },
});

// Location proxy limiter — these endpoints call paid Google Maps APIs and are
// intentionally available to signed-out browsing, so they need a tighter
// per-IP budget than the global limiter.
const locationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  passOnStoreError: true,
  store: createRedisStore("location"),
  message: {
    success: false,
    message: "Too many location requests. Please try again later.",
  },
});

// Upload rate limiter for object-storage endpoints (60 requests per 15 mins in prod, 10000 in dev)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  passOnStoreError: true,
  store: createRedisStore("upload"),
  message: {
    success: false,
    message: "Too many upload requests. Please try again later.",
  },
});

// Admin rate limiter for administrative endpoints (100 requests per 15 mins in prod, 10000 in dev)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  // Fail open: if Redis is down or out of quota, don't turn requests into 500s.
  passOnStoreError: true,
  store: createRedisStore("admin"),
  message: {
    success: false,
    message: "Too many admin requests from this client. Please try again later.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  locationLimiter,
  uploadLimiter,
  adminLimiter,
};

