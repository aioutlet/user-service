import logger from '../utils/logger.js';
import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import userValidator from '../validators/user.validator.js';
import { createError } from '../utils/error.js';

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
  const user = await User.findById(req.user._id);
  if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  res.json(user);
});

// @desc    Update own user profile, password, or deactivate account
// @route   PATCH /users
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const update = {};

  // Profile update
  if ('name' in req.body) {
    if (!userValidator.isValidName(req.body.name)) {
      return next(createError({ status: 400, code: 'INVALID_NAME', message: 'Name is invalid' }));
    }
    update.name = req.body.name;
  }
  if ('isEmailVerified' in req.body) {
    update.isEmailVerified = req.body.isEmailVerified;
  }

  // Password update
  if ('password' in req.body) {
    const passwordValidation = userValidator.isValidPassword(req.body.password);
    if (!passwordValidation.valid) {
      return next(createError({ status: 400, code: 'INVALID_PASSWORD', message: passwordValidation.error }));
    }
    // Only allow if user has local password (not social login only)
    const user = await User.findById(id);
    if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
    if (!user.password) {
      return next(
        createError({
          status: 400,
          code: 'NO_LOCAL_PASSWORD',
          message: 'Password update not allowed for social login accounts',
        })
      );
    }
    user.password = req.body.password;
    await user.save();
    // If only password is being updated, return early
    if (Object.keys(update).length === 0) {
      return res.json({ message: 'Password updated successfully' });
    }
  }

  // Deactivate account
  if ('isActive' in req.body && req.body.isActive === false) {
    update.isActive = false;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  const updatedUser = await User.findByIdAndUpdate(id, update, { new: true });

  if (!updatedUser) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));

  // If account was deactivated
  // if ('isActive' in update && update.isActive === false) {
  //   return res.json({ message: 'Account deactivated', user: updatedUser });
  // }

  res.json(updatedUser);
});

/**
 * @desc    Delete own user account (self-service)
 * @route   DELETE /users
 * @access  Private
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  logger.info('User deleted own account', { userId: id });
  res.status(204).send();
});

// @desc    Find user by email
// @route   GET /users/findByEmail
// @access  Private (service-to-service)
export const findByEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.query;
  if (!email) return next(createError({ status: 400, code: 'EMAIL_REQUIRED', message: 'Email is required' }));
  if (!userValidator.isValidEmail(email))
    return next(createError({ status: 400, code: 'INVALID_EMAIL', message: 'Invalid email' }));
  logger.info(`Finding user by email: ${email}`);
  const user = await User.findOne({ email });
  if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  res.json(user);
});

// @desc    Find user by social provider ID
// @route   GET /users/findBySocial
// @access  Private (service-to-service)
export const findBySocial = asyncHandler(async (req, res, next) => {
  const { provider, id } = req.query;
  logger.debug(`[findBySocial] provider=${provider}, id=${id} (type: ${typeof id})`);
  if (!provider || !id)
    return next(createError({ status: 400, code: 'PROVIDER_ID_REQUIRED', message: 'Provider and id are required' }));
  logger.info(`Finding user by social: provider=${provider}, id=${id}`);
  // Print all users with a non-null social.google.id for debugging
  if (provider === 'google') {
    const usersWithGoogle = await User.find({ 'social.google.id': { $ne: null } }, { email: 1, 'social.google.id': 1 });
    logger.debug(`[findBySocial] Users with social.google.id: ${JSON.stringify(usersWithGoogle)}`);
  }
  const query = { [`social.${provider}.id`]: id };
  logger.debug(`[findBySocial] MongoDB query: ${JSON.stringify(query)}`);
  const user = await User.findOne(query);
  if (!user) {
    logger.warn(`[findBySocial] User not found for provider=${provider}, id=${id}`);
    return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  logger.debug(`[findBySocial] User found: ${JSON.stringify(user)}`);
  res.json(user);
});
