import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../core/logger.js';
import ErrorResponse from '../core/errors.js';
import { getJwtConfig } from '../clients/index.js';

// Cache JWT config to avoid repeated Dapr calls
let jwtConfigCache = null;
const getJwtSecret = async () => {
  if (!jwtConfigCache) {
    jwtConfigCache = await getJwtConfig();
  }
  return jwtConfigCache.secret;
};

/**
 * Middleware for JWT authentication in the user service.
 * Checks for a JWT in the Authorization header or cookies, verifies it, and attaches user info to req.user.
 * Also checks if the user account is active in the database.
 * Responds with 401 Unauthorized or 403 if the account is deactivated.
 */
export async function requireAuth(req, res, next) {
  try {
    let token;
    // Check Authorization header first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      logger.warn('requireAuth: No token found');
      return next(new ErrorResponse('Unauthorized: No token found in Authorization header or cookies', 401));
    }

    // Get JWT secret from Dapr secret store
    const secret = await getJwtSecret();

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      logger.warn('requireAuth: Invalid token', { error: err });
      return next(new ErrorResponse('Unauthorized: Invalid or expired token', 401));
    }

    req.user = {
      _id: decoded.sub || decoded.id, // Use 'sub' (standard JWT claim) or fallback to 'id'
      email: decoded.email,
      roles: decoded.roles || [],
      name: decoded.name,
      emailVerified: decoded.emailVerified,
    };

    // Optional: Check if user exists in local database (only for user-service specific operations)
    // For admin operations that don't require local user data, we trust the JWT
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        // User exists locally, use full user object
        if (user.isActive === false) {
          return next(new ErrorResponse('Forbidden: Account deactivated', 403));
        }
        req.user = user;
      }
      // If user doesn't exist locally, continue with JWT claims (for admin operations)
    } catch (dbError) {
      logger.warn('User lookup failed, continuing with JWT claims', {
        userId: req.user._id,
        error: dbError.message,
      });
    }

    next();
  } catch (err) {
    logger.error('requireAuth: Error during authentication', { error: err });
    return next(new ErrorResponse('Internal server error', 500));
  }
}

/**
 * Middleware to require specific roles
 * Usage: requireRoles('admin', 'manager')
 */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('requireRoles: No authenticated user');
      return next(new ErrorResponse('Unauthorized: Authentication required', 401));
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      logger.warn('requireRoles: Insufficient permissions', {
        userId: req.user._id,
        requiredRoles: roles,
        userRoles: userRoles,
      });
      return next(new ErrorResponse(`Forbidden: Required roles: ${roles.join(' or ')}`, 403));
    }

    logger.info('requireRoles: Authorization successful', {
      userId: req.user._id,
      roles: userRoles,
    });
    next();
  };
}

/**
 * Middleware to require admin role
 * Convenience wrapper around requireRoles
 */
export function requireAdmin(req, res, next) {
  return requireRoles('admin')(req, res, next);
}

/**
 * Middleware to require customer role (or admin)
 * Admins can access customer endpoints
 */
export function requireCustomer(req, res, next) {
  return requireRoles('customer', 'admin')(req, res, next);
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      req.user = null;
      return next();
    }

    // Get JWT secret from Dapr secret store
    const secret = await getJwtSecret();

    try {
      const decoded = jwt.verify(token, secret);
      req.user = {
        _id: decoded.id,
        email: decoded.email,
        roles: decoded.roles || [],
      };
      logger.debug('optionalAuth: Token validated', { userId: req.user._id });
    } catch (err) {
      logger.debug('optionalAuth: Invalid token', { error: err.message });
      req.user = null;
    }

    next();
  } catch (err) {
    logger.error('optionalAuth: Error getting JWT secret', { error: err });
    req.user = null;
    next();
  }
}
