import logger from '../utils/logger.js';
import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import userValidator from '../validators/user.validator.js';

// Helper to throw errors in standard format
function createError({ status = 500, code = 'INTERNAL_ERROR', message = 'Internal server error', details = null }) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.details = details;
  return err;
}

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
export const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  res.json(user);
});

// @desc    Update own user profile
// @route   PATCH /users
// @access  Private
export const updateUser = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  // Allow updating name and isEmailVerified (for verification flow)
  const allowedFields = ['name', 'isEmailVerified'];
  const update = {};
  for (const field of allowedFields) {
    if (field in req.body) update[field] = req.body[field];
  }
  if (Object.keys(update).length === 0) {
    return next(createError({ status: 400, code: 'NO_UPDATABLE_FIELDS', message: 'No updatable fields provided' }));
  }
  if (update.name && !userValidator.isValidName(update.name)) {
    return next(createError({ status: 400, code: 'INVALID_NAME', message: 'Name is invalid' }));
  }
  // No validation needed for isEmailVerified (set by system)
  const user = await User.findByIdAndUpdate(id, update, { new: true });
  if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  res.json(user);
});

// @desc    Change own password
// @route   POST /users/password/change
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const { newPassword } = req.body;

  // Ensure user is authenticated and matches the ID
  if (!req.user || req.user._id !== id) {
    return next(createError({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' }));
  }
  if (!newPassword) {
    return next(createError({ status: 400, code: 'PASSWORD_REQUIRED', message: 'New password is required' }));
  }

  // Validate new password
  const passwordValidation = userValidator.isValidPassword(newPassword);
  if (!passwordValidation.valid) {
    return next(createError({ status: 400, code: 'INVALID_PASSWORD', message: passwordValidation.error }));
  }

  const user = await User.findById(id);
  if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  // Only allow if user has local password (not social login only)
  if (!user.password) {
    return next(
      createError({
        status: 400,
        code: 'NO_LOCAL_PASSWORD',
        message: 'Password update not allowed for social login accounts',
      })
    );
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

// @desc    Find user by email
// @route   GET /users/findByEmail
// @access  Private (service-to-service)
export const findByEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.query;
  if (!email) return next(createError({ status: 400, code: 'EMAIL_REQUIRED', message: 'Email is required' }));
  if (!userValidator.isValidEmail(email))
    return next(createError({ status: 400, code: 'INVALID_EMAIL', message: 'Invalid email' }));
  logger.info('Finding user by email:', email);
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

// @desc    Activate own account
// @route   POST /users/account/activate
// @access  Private
// export const activateAccount = asyncHandler(async (req, res, next) => {
//   const id = req.user._id;
//   const actorId = req.user?._id;
//   const isAdmin = req.user?.roles?.includes('admin');
//   if (!actorId || (actorId !== id && !isAdmin)) {
//     logger.warn('Unauthorized activate attempt', { actorId, targetId: id });
//     return next(createError({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' }));
//   }
//   const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true });
//   if (!user) {
//     logger.warn('Activate failed: user not found', { actorId, targetId: id });
//     return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
//   }
//   logger.info('User activated', { actorId, targetId: id });
//   res.json({ message: 'Account activated', user });
// });

// @desc    Deactivate own account
// @route   POST /users/account/deactivate
// @access  Private
export const deactivateAccount = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const actorId = req.user?._id;
  const isAdmin = req.user?.roles?.includes('admin');
  if (!actorId || (actorId !== id && !isAdmin)) {
    logger.warn('Unauthorized deactivate attempt', { actorId, targetId: id });
    return next(createError({ status: 403, code: 'FORBIDDEN', message: 'Forbidden' }));
  }
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) {
    logger.warn('Deactivate failed: user not found', { actorId, targetId: id });
    return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  logger.info('User deactivated', { actorId, targetId: id });
  res.json({ message: 'Account deactivated', user });
});

// Admin: update any user by ID (including isActive)
export const updateUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // Allow admin to update social field for linking social accounts
  const allowedFields = ['name', 'isEmailVerified', 'isActive', 'roles', 'social'];
  const update = {};
  for (const field of allowedFields) {
    if (field in req.body) update[field] = req.body[field];
  }
  if (Object.keys(update).length === 0) {
    return next(createError({ status: 400, code: 'NO_UPDATABLE_FIELDS', message: 'No updatable fields provided' }));
  }
  if ('name' in update && !userValidator.isValidName(update.name)) {
    return next(createError({ status: 400, code: 'INVALID_NAME', message: 'Name is invalid' }));
  }
  if ('roles' in update && !userValidator.isValidRoles(update.roles)) {
    return next(
      createError({ status: 400, code: 'INVALID_ROLES', message: 'Roles must be an array of non-empty strings.' })
    );
  }
  try {
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) {
      logger.warn('Admin update failed: user not found', { adminId: req.user?._id, targetId: id });
      return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
    }
    logger.info('Admin updated user', { adminId: req.user?._id, targetId: id, update });
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return next(createError({ status: 400, code: 'MONGOOSE_VALIDATION', message: err.message, details: err.errors }));
    }
    return next(err);
  }
});

// @desc    Update user password by ID (admin/service)
// @route   POST /users/:id/password/change
// @access  Admin/Service
export const updateUserPasswordById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) {
    return next(createError({ status: 400, code: 'PASSWORD_REQUIRED', message: 'New password is required' }));
  }
  const passwordValidation = userValidator.isValidPassword(newPassword);
  if (!passwordValidation.valid) {
    return next(createError({ status: 400, code: 'INVALID_PASSWORD', message: passwordValidation.error }));
  }
  const user = await User.findById(id);
  if (!user) return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
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

/**
 * @desc    Admin: delete any user by ID
 * @route   DELETE /users/:id
 * @access  Admin only
 */
export const deleteUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    logger.warn('Admin delete failed: user not found', { adminId: req.user?._id, targetId: id });
    return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  logger.info('Admin deleted user', { adminId: req.user?._id, targetId: id });
  res.status(204).send();
});
