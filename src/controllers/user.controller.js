import logger from '../utils/logger.js';
import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import userValidator from '../validators/user.validator.js';
import { createError } from '../utils/error.js';
import * as userService from '../services/userService.js';

// @desc    Create a new user
// @route   POST /users
// @access  Public
export const createUser = asyncHandler(async (req, res, next) => {
  let { email, password, name, roles, social } = req.body;

  if (!userValidator.isValidEmail(email))
    return next(
      createError({ status: 400, code: 'INVALID_EMAIL', message: 'Email is required, must be valid, 5-100 chars.' })
    );

  // If this is a local registration (no social), require password and name
  if (!social) {
    const passwordValidation = userValidator.isValidPassword(password);
    if (!passwordValidation.valid)
      return next(
        createError({
          status: 400,
          code: 'INVALID_PASSWORD',
          message: passwordValidation.error,
        })
      );
    if (!userValidator.isValidName(name))
      return next(createError({ status: 400, code: 'INVALID_NAME', message: 'Name required, 2-50 chars.' }));
  } else {
    // For social login, provide a default name if not present
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      name = email.split('@')[0]; // fallback: use part of email as name
    }
    // Always set isEmailVerified true for social login
    req.body.isEmailVerified = true;
  }

  if (roles && !userValidator.isValidRoles(roles))
    return next(
      createError({ status: 400, code: 'INVALID_ROLES', message: 'Roles must be an array of non-empty strings.' })
    );
  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createError({ status: 409, code: 'EMAIL_EXISTS', message: 'Email already exists' }));
  }
  logger.info(`Creating user: email=${email}`);
  try {
    // For social login, allow missing password and name
    const user = new User({ email, password, name, roles, social, isEmailVerified: req.body.isEmailVerified });
    await user.save();
    logger.info('User created successfully:', user._id);
    res.status(201).json(user);
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      return next(createError({ status: 400, code: 'MONGOOSE_VALIDATION', message: err.message, details: err.errors }));
    }
    return next(err);
  }
});

// @desc    Get own user profile
// @route   GET /users
// @access  Private
export const getUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user._id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// @desc    Update own user profile, password, or deactivate account
// @route   PATCH /users
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  try {
    const result = await userService.updateUser(req.user._id, req.body, { isAdmin: false });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Delete own user account (self-service)
 * @route   DELETE /users
 * @access  Private
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  try {
    await userService.deleteUser(req.user._id);
    logger.info('User deleted own account', { userId: req.user._id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// @desc    Find user by email
// @route   GET /users/findByEmail
// @access  Private (service-to-service)
export const findByEmail = asyncHandler(async (req, res, next) => {
  try {
    const user = await userService.getUserByEmail(req.query.email);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// @desc    Find user by social provider ID
// @route   GET /users/findBySocial
// @access  Private (service-to-service)
export const findBySocial = asyncHandler(async (req, res, next) => {
  try {
    const user = await userService.getUserBySocial(req.query.provider, req.query.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});
