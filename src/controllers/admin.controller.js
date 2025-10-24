import User from '../models/user.model.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import * as userService from '../services/user.service.js';
import logger from '../observability/index.js';
import messageBrokerService from '../services/messageBrokerServiceClient.js';
import ErrorResponse from '../utils/ErrorResponse.js';

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

  logger.info('Fetching recent users', {
    userId: req.user?._id,
    correlationId: req.correlationId,
    limit,
  });

  try {
    // Get recently created users
    const recentUsers = await User.find({ isActive: { $ne: false } }, 'firstName lastName email roles createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    logger.debug('Found recent users', {
      correlationId: req.correlationId,
      count: recentUsers.length,
    });

    // Transform to match the expected format
    const formattedUsers = recentUsers.map((user) => ({
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.roles.includes('admin') ? 'admin' : 'customer',
      createdAt: user.createdAt.toISOString(),
    }));

    logger.info('Recent users retrieved successfully', {
      userId: req.user?._id,
      correlationId: req.correlationId,
      count: formattedUsers.length,
    });

    res.json(formattedUsers);
  } catch (error) {
    logger.error('Failed to fetch recent users', {
      userId: req.user?._id,
      correlationId: req.correlationId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
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
 * @desc    Create a new user (admin only)
 * @route   POST /admin/users
 * @access  Admin only
 */
export const createUser = asyncHandler(async (req, res, next) => {
  // Map phone field to phoneNumber if provided
  if (req.body.phone && !req.body.phoneNumber) {
    req.body.phoneNumber = req.body.phone;
  }

  // Note: We can't directly call createUserBase because it calls res.status(201).json()
  // and we need to ensure password is excluded from the response.
  // Instead, we'll implement user creation here with proper admin context.

  const { firstName, lastName, email, password, phoneNumber, roles, isActive } = req.body;

  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return next(
      new ErrorResponse('Email, password, first name, and last name are required', 400, 'MISSING_REQUIRED_FIELDS')
    );
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ErrorResponse('Email already exists', 409, 'EMAIL_EXISTS'));
  }

  try {
    // Create new user with admin-specified fields
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password, // Will be hashed by model pre-save middleware
      phoneNumber,
      roles: roles || ['customer'],
      isActive: isActive !== undefined ? isActive : true,
      isEmailVerified: false,
      createdBy: req.user?._id?.toString() || 'ADMIN',
      updatedBy: req.user?._id?.toString() || 'ADMIN',
    });

    logger.info('User created by admin', {
      userId: user._id,
      adminId: req.user?._id,
      correlationId: req.correlationId,
    });

    // Extract client IP and User-Agent for event publishing
    const clientIP =
      req.ip ||
      req.connection?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const correlationId = req.headers['x-correlation-id'] || req.correlationId;

    // Publish user.created event
    await messageBrokerService.publishUserCreated(user, correlationId, clientIP, userAgent);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    logger.error('Failed to create user', {
      error: err.message,
      adminId: req.user?._id,
      correlationId: req.correlationId,
    });
    next(err);
  }
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
