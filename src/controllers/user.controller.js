import ErrorResponse from '../utils/ErrorResponse.js';
import logger from '../observability/index.js';
import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import userValidator from '../validators/user.validator.js';
import * as userService from '../services/user.service.js';

// @desc    Create a new user
// @route   POST /users
// @access  Public
export const createUser = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;

  // Validate required fields
  if (!email) {
    return next(new ErrorResponse('Email is required', 400, 'EMAIL_REQUIRED'));
  }

  if (!userValidator.isValidEmail(email)) {
    return next(new ErrorResponse('Email is required, must be valid, 5-100 chars.', 400, 'INVALID_EMAIL'));
  }

  if (!password) {
    return next(new ErrorResponse('Password is required', 400, 'PASSWORD_REQUIRED'));
  }

  const passwordValidation = userValidator.isValidPassword(password);
  if (!passwordValidation.valid) {
    return next(new ErrorResponse(passwordValidation.error, 400, 'INVALID_PASSWORD'));
  }

  // Validate optional fields if provided
  if (firstName && !userValidator.isValidFirstName(firstName)) {
    return next(
      new ErrorResponse(
        'First name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).',
        400,
        'INVALID_NAME'
      )
    );
  }

  if (lastName && !userValidator.isValidLastName(lastName)) {
    return next(
      new ErrorResponse(
        'Last name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).',
        400,
        'INVALID_NAME'
      )
    );
  }

  if (phoneNumber && !userValidator.isValidPhoneNumber(phoneNumber)) {
    return next(
      new ErrorResponse(
        'Phone number must be valid (7-15 digits, can include spaces, hyphens, parentheses, and optional + prefix).',
        400,
        'INVALID_PHONE_NUMBER'
      )
    );
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already exists', 409, 'EMAIL_EXISTS'));
  }

  const startTime = logger.operationStart('CREATE_USER', req, { email });
  try {
    // Only create user with basic fields - nested documents should be added via specific endpoints
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      // Note: addresses, paymentMethods, wishlist should be added via their respective endpoints
      // Note: tier defaults to 'basic' - upgrades handled through admin actions or payment systems
    });
    await user.save();

    logger.operationComplete('CREATE_USER', startTime, req, {
      userId: user._id,
      email: user.email,
    });

    logger.business('USER_CREATED', req, {
      userId: user._id,
      email: user.email,
      hasEmailVerified: user.isEmailVerified,
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

// Test compatibility functions - aliases to existing functions
export const getUserById = getUser;

// @desc    Deactivate account (set isActive to false)
// @route   PATCH /users/deactivate
// @access  Private
export const deactivateAccount = asyncHandler(async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { isActive: false }, { new: true });
    if (!updatedUser) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }
    res.status(200).json({ message: 'Account deactivated', user: updatedUser });
  } catch (err) {
    next(err);
  }
});

// @desc    Update password
// @route   PATCH /users/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Current password and new password are required', 400, 'PASSWORDS_REQUIRED'));
  }

  try {
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD'));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// @desc    Update user by ID (admin function)
// @route   PATCH /admin/users/:id
// @access  Private/Admin
export const updateUserById = asyncHandler(async (req, res, next) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body, { isAdmin: true });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// @desc    Update user password by ID (admin function)
// @route   PATCH /admin/users/:id/password
// @access  Private/Admin
export const updateUserPasswordById = asyncHandler(async (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return next(new ErrorResponse('New password is required', 400, 'PASSWORD_REQUIRED'));
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'User password updated successfully' });
  } catch (err) {
    next(err);
  }
});
