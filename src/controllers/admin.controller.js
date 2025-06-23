import User from '../models/user.model.js';
import userValidator from '../validators/user.validator.js';
import { createError } from '../utils/error.js';
import asyncHandler from '../middlewares/asyncHandler.js';

/**
 * @desc    Get all users (admin only)
 * @route   GET /admin/users
 * @access  Admin only
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}, '-password'); // Exclude password field
  res.json(users);
});

/**
 * @desc    Get any user by ID (admin only)
 * @route   GET /admin/users/:id
 * @access  Admin only
 */
export const getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!userValidator.isValidObjectId(id)) {
    return next(createError({ status: 400, code: 'INVALID_ID', message: 'Invalid user ID' }));
  }
  const user = await User.findById(id, '-password');
  if (!user) {
    return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  res.json(user);
});

/**
 * @desc    Update any user by ID (admin only)
 * @route   PATCH /admin/users/:id
 * @access  Admin only
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
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
      return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
    }
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return next(createError({ status: 400, code: 'MONGOOSE_VALIDATION', message: err.message, details: err.errors }));
    }
    return next(err);
  }
});

/**
 * @desc    Delete any user by ID (admin only)
 * @route   DELETE /admin/users/:id
 * @access  Admin only
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' }));
  }
  res.status(204).send();
});
