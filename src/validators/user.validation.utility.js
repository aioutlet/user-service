import ErrorResponse from '../utils/ErrorResponse.js';
import userValidator from './user.validator.js';
import userAddressValidator from './user.address.validator.js';
import userPaymentValidator from './user.payment.validator.js';
import userWishlistValidator from './user.wishlist.validator.js';
import userSocialValidator from './user.social.validator.js';

/**
 * Comprehensive validation utility for user data
 * Handles validation for both create and update operations
 */
class UserValidationUtility {
  /**
   * Validates user data fields based on provided options
   * @param {Object} userData - The user data to validate
   * @param {Object} options - Validation options
   * @param {boolean} options.isCreate - Whether this is a creation operation (requires certain fields)
   * @param {boolean} options.isAdmin - Whether this is an admin operation (allows additional fields)
   * @param {boolean} options.requirePassword - Whether password validation is required
   * @returns {Object} - { valid: boolean, errors: Array<string> }
   */
  static validateUserData(userData, options = {}) {
    const { isCreate = false, isAdmin = false, requirePassword = false } = options;
    const errors = [];

    // Email validation (required for create operations)
    if (isCreate && !userData.email) {
      errors.push('Email is required');
    } else if (userData.email && !userValidator.isValidEmail(userData.email)) {
      errors.push('Email is required, must be valid, 5-100 chars.');
    }

    // Password validation
    if (requirePassword || (isCreate && !userData.social)) {
      if (!userData.password) {
        errors.push('Password is required');
      } else {
        const passwordValidation = userValidator.isValidPassword(userData.password);
        if (!passwordValidation.valid) {
          errors.push(passwordValidation.error);
        }
      }
    } else if (userData.password) {
      const passwordValidation = userValidator.isValidPassword(userData.password);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.error);
      }
    }

    // Name fields validation
    if (userData.firstName !== undefined) {
      if (!userValidator.isValidFirstName(userData.firstName)) {
        errors.push('First name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).');
      }
    }

    if (userData.lastName !== undefined) {
      if (!userValidator.isValidLastName(userData.lastName)) {
        errors.push('Last name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).');
      }
    }

    if (userData.displayName !== undefined) {
      if (!userValidator.isValidDisplayName(userData.displayName)) {
        errors.push('Display name must be less than 100 characters.');
      }
    }

    // Roles validation
    if (userData.roles !== undefined) {
      if (!userValidator.isValidRoles(userData.roles)) {
        errors.push('Roles must be an array of valid role strings.');
      }
    }

    // Tier validation (admin-only)
    if (userData.tier !== undefined) {
      if (!isAdmin) {
        errors.push('Tier can only be modified by administrators.');
      } else if (!userValidator.isValidTier(userData.tier)) {
        errors.push('Tier must be a valid tier string (basic, premium, gold, platinum).');
      }
    }

    // Addresses validation
    if (userData.addresses && userData.addresses.length > 0) {
      for (let i = 0; i < userData.addresses.length; i++) {
        const addressValidation = userAddressValidator.validateAddress(userData.addresses[i]);
        if (!addressValidation.valid) {
          errors.push(`Address ${i + 1}: ${addressValidation.errors.join('; ')}`);
        }
      }
    }

    // Payment methods validation
    if (userData.paymentMethods && userData.paymentMethods.length > 0) {
      for (let i = 0; i < userData.paymentMethods.length; i++) {
        const paymentValidation = userPaymentValidator.validatePaymentMethod(userData.paymentMethods[i]);
        if (!paymentValidation.valid) {
          errors.push(`Payment method ${i + 1}: ${paymentValidation.errors.join('; ')}`);
        }
      }
    }

    // Wishlist validation
    if (userData.wishlist && userData.wishlist.length > 0) {
      const wishlistValidation = userWishlistValidator.validateWishlistArray(userData.wishlist);
      if (!wishlistValidation.valid) {
        errors.push(...wishlistValidation.errors);
      }
    }

    // Social accounts validation
    if (userData.social !== undefined) {
      const socialValidation = userSocialValidator.validateSocialAccounts(userData.social);
      if (!socialValidation.valid) {
        errors.push(...socialValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates user data for create operations
   * @param {Object} userData - The user data to validate
   * @param {Object} options - Additional validation options
   * @returns {Object} - { valid: boolean, errors: Array<string> }
   */
  static validateForCreate(userData, options = {}) {
    return this.validateUserData(userData, {
      ...options,
      isCreate: true,
      requirePassword: !userData.social, // Require password if not social login
    });
  }

  /**
   * Validates user data for update operations
   * @param {Object} userData - The user data to validate
   * @param {Object} options - Additional validation options
   * @returns {Object} - { valid: boolean, errors: Array<string> }
   */
  static validateForUpdate(userData, options = {}) {
    return this.validateUserData(userData, {
      ...options,
      isCreate: false,
    });
  }

  /**
   * Throws an ErrorResponse if validation fails
   * @param {Object} validation - Result from validation method
   * @param {string} defaultErrorCode - Default error code if not specified
   */
  static throwIfInvalid(validation, defaultErrorCode = 'VALIDATION_ERROR') {
    if (!validation.valid) {
      throw new ErrorResponse(validation.errors.join('; '), 400, defaultErrorCode);
    }
  }

  /**
   * Returns middleware-style error response for Express.js
   * @param {Object} validation - Result from validation method
   * @param {Function} next - Express next function
   * @param {string} defaultErrorCode - Default error code if not specified
   * @returns {Function|null} - Calls next with error or returns null if valid
   */
  static handleValidationError(validation, next, defaultErrorCode = 'VALIDATION_ERROR') {
    if (!validation.valid) {
      return next(new ErrorResponse(validation.errors.join('; '), 400, defaultErrorCode));
    }
    return null;
  }

  /**
   * Gets allowed fields for update operations based on user role
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {Array<string>} - Array of allowed field names
   */
  static getAllowedUpdateFields(isAdmin = false) {
    return isAdmin
      ? [
          'firstName',
          'lastName',
          'displayName',
          'email',
          'isEmailVerified',
          'isActive',
          'roles',
          'tier',
          'social',
          'password',
          'addresses',
          'paymentMethods',
          'wishlist',
          'preferences',
        ]
      : [
          'firstName',
          'lastName',
          'displayName',
          'isActive',
          'isEmailVerified',
          'password',
          'addresses',
          'paymentMethods',
          'wishlist',
          'preferences',
        ];
  }

  /**
   * Filters user data to only include allowed fields
   * @param {Object} userData - The raw user data
   * @param {boolean} isAdmin - Whether this is an admin operation
   * @returns {Object} - Filtered user data with only allowed fields
   */
  static filterAllowedFields(userData, isAdmin = false) {
    const allowedFields = this.getAllowedUpdateFields(isAdmin);
    const filtered = {};

    for (const field of allowedFields) {
      if (field in userData) {
        filtered[field] = userData[field];
      }
    }

    return filtered;
  }
}

export default UserValidationUtility;
