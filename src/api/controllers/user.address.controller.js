import asyncHandler from '../middlewares/asyncHandler.js';
import ErrorResponse from '../../shared/utils/ErrorResponse.js';
import userAddressValidator from '../../shared/validators/user.address.validator.js';
import User from '../../shared/models/user.model.js';
import logger from '../../shared/observability/index.js';

/**
 * User Address Management Controller
 * Handles all address-related operations for authenticated users
 */

/**
 * @desc    Get all addresses for the authenticated user
 * @route   GET /users/addresses
 * @access  Private
 */
export const getAddresses = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    logger.info(`Addresses retrieved for user: ${req.user._id}`);
    res.json({
      addresses: user.addresses || [],
      count: user.addresses?.length || 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Add address to user's address list
 * @route   POST /users/addresses
 * @access  Private
 */
export const addAddress = asyncHandler(async (req, res, next) => {
  const addressData = req.body;

  // Validate the address data directly using address validator
  const validation = userAddressValidator.validateAddress(addressData);
  if (!validation.valid) {
    return next(new ErrorResponse(validation.errors.join('; '), 400, 'INVALID_ADDRESS'));
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    user.addresses.push(addressData);
    await user.save();

    logger.info(`Address added for user: ${req.user._id}`);
    res.status(201).json({
      message: 'Address added successfully',
      address: user.addresses[user.addresses.length - 1],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Update specific address
 * @route   PATCH /users/addresses/:addressId
 * @access  Private
 */
export const updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const addressData = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return next(new ErrorResponse('Address not found', 404, 'ADDRESS_NOT_FOUND'));
    }

    // Merge existing address with incoming data for validation
    const mergedAddress = { ...address.toObject(), ...addressData };

    // Validate the complete merged address using address validator
    const validation = userAddressValidator.validateAddress(mergedAddress);
    if (!validation.valid) {
      return next(new ErrorResponse(validation.errors.join('; '), 400, 'INVALID_ADDRESS'));
    }

    // Update only the provided fields
    Object.assign(address, addressData);
    await user.save();

    logger.info(`Address updated for user: ${req.user._id}, address: ${addressId}`);
    res.json({ message: 'Address updated successfully', address });
  } catch (err) {
    next(err);
  }
});

/**
 * @desc    Remove address from user's address list
 * @route   DELETE /users/addresses/:addressId
 * @access  Private
 */
export const removeAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404, 'USER_NOT_FOUND'));
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return next(new ErrorResponse('Address not found', 404, 'ADDRESS_NOT_FOUND'));
    }

    user.addresses.pull(addressId);
    await user.save();

    logger.info(`Address removed for user: ${req.user._id}, address: ${addressId}`);
    res.json({ message: 'Address removed successfully' });
  } catch (err) {
    next(err);
  }
});
