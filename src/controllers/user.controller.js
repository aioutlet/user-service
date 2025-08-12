import ErrorResponse from '../utils/ErrorResponse.js';
import logger from '../utils/logger.js';
import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import UserValidationUtility from '../validators/user.validation.utility.js';
import * as userService from '../services/user.service.js';
import CorrelationIdHelper from '../utils/correlationId.helper.js';

// @desc    Create a new user
// @route   POST /users
// @access  Public
export const createUser = asyncHandler(async (req, res, next) => {
  let {
    email,
    password,
    firstName,
    lastName,
    displayName,
    roles,
    social,
    addresses,
    paymentMethods,
    wishlist,
    preferences,
  } = req.body;

  // Validate user data for creation
  const validation = UserValidationUtility.validateForCreate(req.body);
  if (!validation.valid) {
    return next(new ErrorResponse(validation.errors.join('; '), 400, 'USER_VALIDATION_ERROR'));
  }

  // Set email verification for social logins
  if (social) {
    req.body.isEmailVerified = true;
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already exists', 409, 'EMAIL_EXISTS'));
  }

  logger.info(`Creating user: email=${email}`, { correlationId: CorrelationIdHelper.getCorrelationId(req) });
  try {
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      displayName,
      roles,
      social,
      addresses,
      paymentMethods,
      wishlist,
      preferences,
      isEmailVerified: req.body.isEmailVerified,
      // Note: tier is not included here - users start with default 'basic' tier
      // Tier upgrades should be handled through admin actions or payment systems
    });
    await user.save();
    logger.info('User created successfully:', {
      userId: user._id,
      correlationId: CorrelationIdHelper.getCorrelationId(req),
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return next(new ErrorResponse(err.message, 400, 'MONGOOSE_VALIDATION', { errors: err.errors }));
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
