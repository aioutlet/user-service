import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import logger from '../utils/logger.js';

// Helper function to get rate limit values from environment variables
const getRateLimitValue = (envVar, defaultValue) => {
  const value = parseInt(process.env[envVar], 10);
  return isNaN(value) ? defaultValue : value;
};

// Rate limiting configuration based on endpoint sensitivity
const rateLimitConfig = {
  // User profile operations (moderate)
  profile: {
    windowMs: getRateLimitValue('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    max: getRateLimitValue('RATE_LIMIT_MAX_REQUESTS', 20), // 20 profile operations per window
    message: {
      error: 'Too many profile operations',
      message: 'Please try again later',
      retryAfter: getRateLimitValue('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for profile operations', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many profile operations',
        message: 'Please try again later',
        retryAfter: getRateLimitValue('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
      });
    },
  },

  // User creation (strict)
  userCreation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 user creations per hour per IP
    message: {
      error: 'Too many user creation attempts',
      message: 'Please try again later',
      retryAfter: 60 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for user creation', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many user creation attempts',
        message: 'Please try again later',
        retryAfter: 60 * 60 * 1000,
      });
    },
  },

  // Address management (moderate)
  addressManagement: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 15, // 15 address operations per window
    message: {
      error: 'Too many address operations',
      message: 'Please try again later',
      retryAfter: 10 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for address management', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many address operations',
        message: 'Please try again later',
        retryAfter: 10 * 60 * 1000,
      });
    },
  },

  // Payment method management (strict)
  paymentManagement: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 payment operations per window
    message: {
      error: 'Too many payment operations',
      message: 'Please try again later',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for payment management', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many payment operations',
        message: 'Please try again later',
        retryAfter: 15 * 60 * 1000,
      });
    },
  },

  // Wishlist operations (lenient)
  wishlist: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30, // 30 wishlist operations per window
    message: {
      error: 'Too many wishlist operations',
      message: 'Please try again later',
      retryAfter: 10 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for wishlist operations', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many wishlist operations',
        message: 'Please try again later',
        retryAfter: 10 * 60 * 1000,
      });
    },
  },

  // User lookup operations (moderate)
  userLookup: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 lookup operations per window
    message: {
      error: 'Too many lookup attempts',
      message: 'Please try again later',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for user lookup', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many lookup attempts',
        message: 'Please try again later',
        retryAfter: 15 * 60 * 1000,
      });
    },
  },

  // Admin operations (strict)
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 admin operations per window
    message: {
      error: 'Too many admin operations',
      message: 'Please try again later',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for admin operations', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
        userId: req.user?.id,
      });
      res.status(429).json({
        error: 'Too many admin operations',
        message: 'Please try again later',
        retryAfter: 15 * 60 * 1000,
      });
    },
  },

  // General API endpoints (lenient)
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded for general API', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        correlationId: req.correlationId,
      });
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: 15 * 60 * 1000,
      });
    },
  },
};

// Progressive delay for sensitive operations
const sensitiveOperationsSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Start delaying after 5 attempts
  delayMs: (used) => Math.min(used * 200, 10000), // Progressive delay: 200ms per attempt, max 10s
  skipFailedRequests: false,
  skipSuccessfulRequests: true, // Don't delay successful requests
  skip: (req, _res) => {
    // Skip health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
  validate: {
    delayMs: false, // Disable warning about delayMs
  },
});

// Create rate limiters
export const profileRateLimit = rateLimit(rateLimitConfig.profile);
export const userCreationRateLimit = rateLimit(rateLimitConfig.userCreation);
export const addressManagementRateLimit = rateLimit(rateLimitConfig.addressManagement);
export const paymentManagementRateLimit = rateLimit(rateLimitConfig.paymentManagement);
export const wishlistRateLimit = rateLimit(rateLimitConfig.wishlist);
export const userLookupRateLimit = rateLimit(rateLimitConfig.userLookup);
export const adminRateLimit = rateLimit(rateLimitConfig.admin);
export const generalRateLimit = rateLimit(rateLimitConfig.general);

// Export slow down middleware for sensitive operations
export { sensitiveOperationsSlowDown };

// Utility function to skip rate limiting for health checks and monitoring
export const skipHealthChecks = (req) => {
  return req.path.startsWith('/health') || req.path.startsWith('/metrics');
};

// Apply skipHealthChecks to all rate limiters
[
  profileRateLimit,
  userCreationRateLimit,
  addressManagementRateLimit,
  paymentManagementRateLimit,
  wishlistRateLimit,
  userLookupRateLimit,
  adminRateLimit,
  generalRateLimit,
].forEach((limiter) => {
  limiter.skip = skipHealthChecks;
});

export default {
  profileRateLimit,
  userCreationRateLimit,
  addressManagementRateLimit,
  paymentManagementRateLimit,
  wishlistRateLimit,
  userLookupRateLimit,
  adminRateLimit,
  generalRateLimit,
  sensitiveOperationsSlowDown,
};
