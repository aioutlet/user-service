import jwt from 'jsonwebtoken';
import { requireEnv } from '../utils/requireEnv.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

const JWT_SECRET = requireEnv('JWT_SECRET');

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
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      _id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
    };
  } catch (err) {
    logger.warn('requireAuth: Invalid token', { error: err });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Check if user is active
  User.findById(req.user._id)
    .then((user) => {
      if (!user || user.isActive === false) {
        logger.warn('requireAuth: User not found or deactivated', { userId: req.user._id });
        return res.status(403).json({ error: 'Account is deactivated.' });
      }
      next();
    })
    .catch((err) => {
      logger.warn('requireAuth: DB error', { error: err });
      res.status(401).json({ error: 'Unauthorized' });
    });
}

/**
 * Middleware to require one or more user roles (e.g., 'admin', 'user').
 * Responds with 403 Forbidden if the user does not have any of the required roles.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.some((role) => req.user.roles?.includes(role))) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
