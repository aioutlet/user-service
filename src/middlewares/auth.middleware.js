import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/user.model.js';
import logger from '../observability/index.js';
import ErrorResponse from '../utils/ErrorResponse.js';

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
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      _id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
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
