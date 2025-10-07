import asyncHandler from '../middlewares/asyncHandler.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import UserValidationUtility from '../validators/user.validation.utility.js';
import User from '../models/user.model.js';
import logger from '../observability/index.js';

/**
 * User Payment Methods Management Controller
 * Handles all payment method-related operations for authenticated users
 */

/**
 * @desc    Get all payment methods for the authenticated user
 * @route   GET /users/payment-methods
 * @access  Private
 */
export const getPaymentMethods = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('paymentMethods');
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    logger.info(`Payment methods retrieved for user: ${req.user._id}`);
    res.json({
      paymentMethods: user.paymentMethods || [],
      count: user.paymentMethods?.length || 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Add payment method to user's payment methods list
 * @route   POST /users/payment-methods
 * @access  Private
 */
export const addPaymentMethod = asyncHandler(async (req, res, next) => {
  const paymentData = req.body;

  // Validate the payment method data
  const validation = UserValidationUtility.validateUserData({ paymentMethods: [paymentData] });
  if (!validation.valid) {
    return next(new ErrorResponse(validation.errors.join('; '), 400, 'INVALID_PAYMENT_METHOD'));
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Use normalized payment data from validation (transforms frontend fields to backend schema)
    // Extract only the fields that should be stored in the database
    const normalizedPayment = validation.normalizedPayment || paymentData;

    // Remove fields that should never be stored: cardNumber, cvv, billingAddress
    // eslint-disable-next-line no-unused-vars
    const { cardNumber, cvv, billingAddress, ...paymentToStore } = normalizedPayment;

    // If isDefault is true, unset existing default
    if (paymentToStore.isDefault) {
      user.paymentMethods.forEach((pm) => {
        pm.isDefault = false;
      });
    }

    user.paymentMethods.push(paymentToStore);
    await user.save();

    logger.info(`Payment method added for user: ${req.user._id}`);
    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethod: user.paymentMethods[user.paymentMethods.length - 1],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Update specific payment method
 * @route   PATCH /users/payment-methods/:paymentId
 * @access  Private
 */
export const updatePaymentMethod = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;
  const paymentData = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    const paymentMethod = user.paymentMethods.id(paymentId);
    if (!paymentMethod) {
      return next(new ErrorResponse('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND'));
    }

    // Merge existing payment method with incoming data for validation
    const mergedPaymentMethod = { ...paymentMethod.toObject(), ...paymentData };

    // Validate the complete merged payment method
    const validation = UserValidationUtility.validateUserData({ paymentMethods: [mergedPaymentMethod] });
    if (!validation.valid) {
      return next(new ErrorResponse(validation.errors.join('; '), 400, 'INVALID_PAYMENT_METHOD'));
    }

    // Update only the provided fields
    Object.assign(paymentMethod, paymentData);
    await user.save();

    logger.info(`Payment method updated for user: ${req.user._id}, payment: ${paymentId}`);
    res.json({ message: 'Payment method updated successfully', paymentMethod });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Remove payment method from user's payment methods list
 * @route   DELETE /users/payment-methods/:paymentId
 * @access  Private
 */
export const removePaymentMethod = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    const paymentMethod = user.paymentMethods.id(paymentId);
    if (!paymentMethod) {
      return next(new ErrorResponse('Payment method not found', 404, 'PAYMENT_METHOD_NOT_FOUND'));
    }

    user.paymentMethods.pull(paymentId);
    await user.save();

    logger.info(`Payment method removed for user: ${req.user._id}, payment: ${paymentId}`);
    res.json({ message: 'Payment method removed successfully' });
  } catch (err) {
    next(err);
  }
});
