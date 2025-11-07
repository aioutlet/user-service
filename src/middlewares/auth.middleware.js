import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../core/logger.js';
import ErrorResponse from '../core/errors.js';

/**
 * Middleware for JWT authentication in the user service.
 * Checks for a JWT in the Authorization header or cookies, verifies it, and attaches user info to req.user.
 * Also checks if the user account is active in the database.
 * Responds with 401 Unauthorized or 403 if the account is deactivated.
 */
export function requireAuth(req, res, next) {
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
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      _id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [],
    };
  } catch (err) {
    logger.warn('requireAuth: Invalid token', { error: err });
    return next(new ErrorResponse('Unauthorized: Invalid or expired token', 401));
  }
  // Check if user is active
  User.findById(req.user._id)
    .then((user) => {
      if (!user || user.isActive === false) {
        return next(new ErrorResponse('Forbidden: Account deactivated or not found', 403));
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      logger.error('requireAuth: DB error', { error: err });
      return next(new ErrorResponse('Internal server error', 500));
    });
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
export function optionalAuth(req, res, next) {
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
}
