import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import * as userService from '../services/user.service.js';
import logger from '../observability/index.js';
import messageBrokerService from '../services/messageBrokerServiceClient.js';

/**
 * @desc    Get user statistics for admin dashboard
 * @route   GET /admin/stats
 * @access  Admin only
 */
export const getUserStats = asyncHandler(async (req, res, _next) => {
  logger.info('Fetching user statistics', {
    userId: req.user?._id,
    correlationId: req.correlationId,
  });
  // Get current date for calculations
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Parallel aggregation queries for better performance
  const [totalUsers, activeUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
    // Total users count
    User.countDocuments({ isActive: { $ne: false } }),

    // Active users (logged in within last 30 days)
    User.countDocuments({
      isActive: { $ne: false },
      lastLoginAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    }),

    // New users this month
    User.countDocuments({
      createdAt: { $gte: firstDayThisMonth },
    }),

    // New users last month (for growth calculation)
    User.countDocuments({
      createdAt: {
        $gte: firstDayLastMonth,
        $lte: lastDayLastMonth,
      },
    }),
  ]);

  // Calculate growth percentage
  const growth =
    newUsersLastMonth > 0
      ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
      : newUsersThisMonth > 0
      ? 100
      : 0;

  const stats = {
    total: totalUsers,
    active: activeUsers,
    newThisMonth: newUsersThisMonth,
    growth: parseFloat(growth),
  };

  logger.info('User statistics retrieved successfully', {
    userId: req.user?._id,
    correlationId: req.correlationId,
    stats,
  });

  res.json(stats);
});

/**
 * @desc    Get recent users for admin dashboard
 * @route   GET /admin/users/recent
 * @access  Admin only
 */
export const getRecentUsers = asyncHandler(async (req, res, _next) => {
  const limit = parseInt(req.query.limit) || 5;

  // Get recently created users
  const recentUsers = await User.find({ isActive: { $ne: false } }, 'firstName lastName email roles createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // Transform to match the expected format
  const formattedUsers = recentUsers.map((user) => ({
    id: user._id.toString(),
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    role: user.roles.includes('admin') ? 'admin' : 'customer',
    createdAt: user.createdAt.toISOString(),
  }));

  res.json(formattedUsers);
});

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

    // Extract client IP address
    const clientIP =
      req.ip ||
      req.connection?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    // Extract User-Agent string
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Publish user.updated event to message broker (admin update)
    const correlationId = req.headers['x-correlation-id'] || req.correlationId;
    await messageBrokerService.publishUserUpdated(
      result,
      correlationId,
      req.user?._id?.toString(),
      clientIP,
      userAgent
    );

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
