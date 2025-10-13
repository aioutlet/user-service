import User from '../../shared/models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import * as userService from '../../shared/services/user.service.js';

/**
 * @desc    Get all users (admin only)
 * @route   GET /admin/users
 * @access  Admin only
 */
export const getUsers = asyncHandler(async (req, res, _next) => {
  const users = await User.find({}, '-password'); // Exclude password field
  res.json(users);
});

/**
 * @desc    Get any user by ID (admin only)
 * @route   GET /admin/users/:id
 * @access  Admin only
 */
export const getUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Update any user by ID (admin only)
 * @route   PATCH /admin/users/:id
 * @access  Admin only
 */
export const updateUser = asyncHandler(async (req, res, next) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body, { isAdmin: true });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Delete any user by ID (admin only)
 * @route   DELETE /admin/users/:id
 * @access  Admin only
 */
export const deleteUser = asyncHandler(async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
