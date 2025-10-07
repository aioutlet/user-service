import ErrorResponse from '../utils/ErrorResponse.js';
import userValidator from './user.validator.js';
import userAddressValidator from './user.address.validator.js';
import userPaymentValidator from './user.payment.validator.js';
import userWishlistValidator from './user.wishlist.validator.js';

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
   * @returns {Object} - { valid: boolean, errors: Array<string>,
   *                       detailedErrors: Array<{message: string, code: string}> }
   */
  static validateUserData(userData, options = {}) {
    const { isCreate = false, isAdmin = false, requirePassword = false } = options;
    const errors = [];
    const detailedErrors = [];

    // Email validation (required for create operations)
    if (isCreate && !userData.email) {
      errors.push('Email is required');
      detailedErrors.push({ message: 'Email is required', code: 'EMAIL_REQUIRED' });
    } else if (userData.email && !userValidator.isValidEmail(userData.email)) {
      errors.push('Email is required, must be valid, 5-100 chars.');
      detailedErrors.push({ message: 'Email is required, must be valid, 5-100 chars.', code: 'INVALID_EMAIL' });
    }

    // Password validation
    if (requirePassword || isCreate) {
      if (!userData.password) {
        errors.push('Password is required');
        detailedErrors.push({ message: 'Password is required', code: 'PASSWORD_REQUIRED' });
      } else {
        const passwordValidation = userValidator.isValidPassword(userData.password);
        if (!passwordValidation.valid) {
          errors.push(passwordValidation.error);
          detailedErrors.push({ message: passwordValidation.error, code: 'INVALID_PASSWORD' });
        }
      }
    } else if (userData.password) {
      const passwordValidation = userValidator.isValidPassword(userData.password);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.error);
        detailedErrors.push({ message: passwordValidation.error, code: 'INVALID_PASSWORD' });
      }
    }

    // Name fields validation
    if (userData.firstName !== undefined) {
      if (!userValidator.isValidFirstName(userData.firstName)) {
        errors.push('First name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).');
        detailedErrors.push({
          message: 'First name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).',
          code: 'INVALID_NAME',
        });
      }
    }

    if (userData.lastName !== undefined) {
      if (!userValidator.isValidLastName(userData.lastName)) {
        errors.push('Last name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).');
        detailedErrors.push({
          message: 'Last name must contain only letters, spaces, hyphens, apostrophes, and periods (max 50 chars).',
          code: 'INVALID_NAME',
        });
      }
    }

    if (userData.displayName !== undefined) {
      if (!userValidator.isValidDisplayName(userData.displayName)) {
        errors.push('Display name must be less than 100 characters.');
        detailedErrors.push({ message: 'Display name must be less than 100 characters.', code: 'INVALID_NAME' });
      }
    }

    // Phone number validation
    if (userData.phoneNumber !== undefined) {
      if (!userValidator.isValidPhoneNumber(userData.phoneNumber)) {
        errors.push(
          'Phone number must be valid (7-15 digits, can include spaces, hyphens, parentheses, and optional + prefix).'
        );
        detailedErrors.push({
          message:
            'Phone number must be valid (7-15 digits, can include spaces, hyphens, parentheses, and optional + prefix).',
          code: 'INVALID_PHONE_NUMBER',
        });
      }
    }

    // Roles validation
    if (userData.roles !== undefined) {
      if (!userValidator.isValidRoles(userData.roles)) {
        errors.push('Roles must be an array of valid role strings.');
        detailedErrors.push({ message: 'Roles must be an array of valid role strings.', code: 'INVALID_ROLES' });
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
    const normalizedPayments = [];
    if (userData.paymentMethods && userData.paymentMethods.length > 0) {
      for (let i = 0; i < userData.paymentMethods.length; i++) {
        const paymentValidation = userPaymentValidator.validatePaymentMethod(userData.paymentMethods[i]);
        if (!paymentValidation.valid) {
          errors.push(`Payment method ${i + 1}: ${paymentValidation.errors.join('; ')}`);
        } else if (paymentValidation.normalizedPayment) {
          normalizedPayments.push(paymentValidation.normalizedPayment);
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

    return {
      valid: errors.length === 0,
      errors,
      detailedErrors,
      // Include normalized payment data if available
      normalizedPayment: normalizedPayments.length > 0 ? normalizedPayments[0] : null,
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
      requirePassword: true, // Password always required for create
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
          'phoneNumber',
          'email',
          'isEmailVerified',
          'isActive',
          'roles',
          'tier',
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
          'phoneNumber',
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
