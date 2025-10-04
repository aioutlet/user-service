import UserValidationUtility from '../src/validators/user.validation.utility.js';
import userValidator from '../src/validators/user.validator.js';
import userAddressValidator from '../src/validators/user.address.validator.js';
import userPaymentValidator from '../src/validators/user.payment.validator.js';
import userWishlistValidator from '../src/validators/user.wishlist.validator.js';
import ErrorResponse from '../src/utils/ErrorResponse.js';

jest.mock('../src/validators/user.validator.js');
jest.mock('../src/validators/user.address.validator.js');
jest.mock('../src/validators/user.payment.validator.js');
jest.mock('../src/validators/user.wishlist.validator.js');

describe('UserValidationUtility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mocks for all validators
    userValidator.isValidEmail = jest.fn().mockReturnValue(true);
    userValidator.isValidPassword = jest.fn().mockReturnValue({ valid: true });
    userValidator.isValidFirstName = jest.fn().mockReturnValue(true);
    userValidator.isValidLastName = jest.fn().mockReturnValue(true);
    userValidator.isValidDisplayName = jest.fn().mockReturnValue(true);
    userValidator.isValidPhoneNumber = jest.fn().mockReturnValue(true);
    userValidator.isValidRoles = jest.fn().mockReturnValue(true);
    userValidator.isValidTier = jest.fn().mockReturnValue(true);
    userAddressValidator.validateAddress = jest.fn().mockReturnValue({ valid: true, errors: [] });
    userPaymentValidator.validatePaymentMethod = jest.fn().mockReturnValue({ valid: true, errors: [] });
    userWishlistValidator.validateWishlistArray = jest.fn().mockReturnValue({ valid: true, errors: [] });
  });

  describe('validateUserData', () => {
    it('should validate basic user data', () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = UserValidationUtility.validateUserData(userData);

      expect(userValidator.isValidEmail).toHaveBeenCalledWith('test@example.com');
      expect(userValidator.isValidFirstName).toHaveBeenCalledWith('John');
      expect(userValidator.isValidLastName).toHaveBeenCalledWith('Doe');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should aggregate errors from all validators', () => {
      const userData = {
        email: 'invalid-email',
        firstName: '',
        addresses: [{ street: '' }],
      };

      userValidator.isValidEmail.mockReturnValue(false);
      userValidator.isValidFirstName.mockReturnValue(false);
      userAddressValidator.validateAddress.mockReturnValue({
        valid: false,
        errors: ['Street is required'],
      });

      const result = UserValidationUtility.validateUserData(userData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate addresses when present', () => {
      const userData = {
        email: 'test@example.com',
        addresses: [
          {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
          },
        ],
      };

      UserValidationUtility.validateUserData(userData);

      expect(userAddressValidator.validateAddress).toHaveBeenCalledWith(userData.addresses[0]);
    });

    it('should validate multiple addresses', () => {
      const userData = {
        email: 'test@example.com',
        addresses: [
          { street: '123 Main St', city: 'NYC' },
          { street: '456 Oak Ave', city: 'LA' },
        ],
      };

      UserValidationUtility.validateUserData(userData);

      expect(userAddressValidator.validateAddress).toHaveBeenCalledTimes(2);
      expect(userAddressValidator.validateAddress).toHaveBeenNthCalledWith(1, userData.addresses[0]);
      expect(userAddressValidator.validateAddress).toHaveBeenNthCalledWith(2, userData.addresses[1]);
    });

    it('should validate payment methods when present', () => {
      const userData = {
        email: 'test@example.com',
        paymentMethods: [
          {
            type: 'credit_card',
            cardNumber: '4111111111111111',
            expiryDate: '12/25',
          },
        ],
      };

      UserValidationUtility.validateUserData(userData);

      expect(userPaymentValidator.validatePaymentMethod).toHaveBeenCalledWith(userData.paymentMethods[0]);
    });

    it('should validate multiple payment methods', () => {
      const userData = {
        email: 'test@example.com',
        paymentMethods: [
          { type: 'credit_card', cardNumber: '4111111111111111' },
          { type: 'paypal', email: 'paypal@example.com' },
        ],
      };

      UserValidationUtility.validateUserData(userData);

      expect(userPaymentValidator.validatePaymentMethod).toHaveBeenCalledTimes(2);
      expect(userPaymentValidator.validatePaymentMethod).toHaveBeenNthCalledWith(1, userData.paymentMethods[0]);
      expect(userPaymentValidator.validatePaymentMethod).toHaveBeenNthCalledWith(2, userData.paymentMethods[1]);
    });

    it('should validate wishlist when present', () => {
      const userData = {
        email: 'test@example.com',
        wishlist: ['product1', 'product2'],
      };

      UserValidationUtility.validateUserData(userData);

      expect(userWishlistValidator.validateWishlistArray).toHaveBeenCalledWith(userData.wishlist);
    });

    it('should skip validation for empty arrays', () => {
      const userData = {
        email: 'test@example.com',
        addresses: [],
        paymentMethods: [],
      };

      UserValidationUtility.validateUserData(userData);

      expect(userAddressValidator.validateAddress).not.toHaveBeenCalled();
      expect(userPaymentValidator.validatePaymentMethod).not.toHaveBeenCalled();
    });

    it('should skip validation for null arrays', () => {
      const userData = {
        email: 'test@example.com',
        addresses: null,
        paymentMethods: null,
      };

      UserValidationUtility.validateUserData(userData);

      expect(userAddressValidator.validateAddress).not.toHaveBeenCalled();
      expect(userPaymentValidator.validatePaymentMethod).not.toHaveBeenCalled();
    });

    it('should require password for create without social', () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const result = UserValidationUtility.validateUserData(userData, { isCreate: true });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should require email for create operations', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = UserValidationUtility.validateUserData(userData, { isCreate: true });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should validate invalid email', () => {
      const userData = {
        email: 'invalid-email',
      };

      userValidator.isValidEmail.mockReturnValue(false);

      const result = UserValidationUtility.validateUserData(userData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Email is required, must be valid');
    });

    it('should validate password when provided', () => {
      const userData = {
        email: 'test@example.com',
        password: 'short',
      };

      userValidator.isValidPassword.mockReturnValue({
        valid: false,
        error: 'Password must be at least 8 characters',
      });

      const result = UserValidationUtility.validateUserData(userData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should validate first name format', () => {
      const userData = {
        email: 'test@example.com',
        firstName: '123InvalidName',
      };

      userValidator.isValidFirstName.mockReturnValue(false);

      const result = UserValidationUtility.validateUserData(userData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('First name must contain only letters');
    });

    it('should validate phone number format', () => {
      const userData = {
        email: 'test@example.com',
        phoneNumber: 'invalid',
      };

      userValidator.isValidPhoneNumber.mockReturnValue(false);

      const result = UserValidationUtility.validateUserData(userData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Phone number must be valid');
    });

    it('should validate roles array', () => {
      const userData = {
        email: 'test@example.com',
        roles: ['invalid_role'],
      };

      userValidator.isValidRoles.mockReturnValue(false);

      const result = UserValidationUtility.validateUserData(userData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Roles must be an array of valid role strings');
    });

    it('should reject tier modification by non-admin', () => {
      const userData = {
        email: 'test@example.com',
        tier: 'platinum',
      };

      const result = UserValidationUtility.validateUserData(userData, { isAdmin: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Tier can only be modified by administrators');
    });

    it('should allow tier modification by admin', () => {
      const userData = {
        email: 'test@example.com',
        tier: 'platinum',
      };

      const result = UserValidationUtility.validateUserData(userData, { isAdmin: true });

      expect(result.valid).toBe(true);
    });
  });

  describe('filterAllowedFields', () => {
    it('should allow user-level fields for non-admin', () => {
      const fields = {
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'JohnD',
        password: 'newpass123',
      };

      const result = UserValidationUtility.filterAllowedFields(fields, false);

      expect(result).toEqual(fields);
    });

    it('should filter out admin-only fields for non-admin', () => {
      const fields = {
        firstName: 'John',
        roles: ['admin'],
        tier: 'platinum',
        email: 'test@example.com',
      };

      const result = UserValidationUtility.filterAllowedFields(fields, false);

      expect(result.firstName).toBe('John');
      expect(result.roles).toBeUndefined();
      expect(result.tier).toBeUndefined();
      expect(result.email).toBeUndefined(); // email is not in user allowed fields
    });

    it('should allow all fields for admin', () => {
      const fields = {
        firstName: 'John',
        roles: ['admin'],
        tier: 'platinum',
        isActive: false,
      };

      const result = UserValidationUtility.filterAllowedFields(fields, true);

      expect(result).toEqual(fields);
    });

    it('should filter out protected fields even for admin', () => {
      const fields = {
        firstName: 'John',
        _id: 'protected-id',
        __v: 1,
        createdAt: new Date(),
      };

      const result = UserValidationUtility.filterAllowedFields(fields, true);

      expect(result).toEqual({ firstName: 'John' });
      expect(result._id).toBeUndefined();
      expect(result.__v).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
    });

    it('should handle empty object', () => {
      const result = UserValidationUtility.filterAllowedFields({}, false);

      expect(result).toEqual({});
    });

    it('should preserve nested objects for allowed fields', () => {
      const fields = {
        firstName: 'John',
        addresses: [{ street: '123 Main St' }],
        wishlist: ['item1', 'item2'],
      };

      const result = UserValidationUtility.filterAllowedFields(fields, false);

      expect(result.addresses).toEqual(fields.addresses);
      expect(result.wishlist).toEqual(fields.wishlist);
    });

    it('should handle undefined fields gracefully', () => {
      const fields = {
        firstName: 'John',
        lastName: undefined,
      };

      const result = UserValidationUtility.filterAllowedFields(fields, false);

      expect(result).toEqual({ firstName: 'John', lastName: undefined });
    });
  });

  describe('getAllowedUpdateFields', () => {
    it('should return user-level fields for non-admin', () => {
      const fields = UserValidationUtility.getAllowedUpdateFields(false);

      expect(fields).toContain('firstName');
      expect(fields).toContain('lastName');
      expect(fields).toContain('displayName');
      expect(fields).toContain('password');
      expect(fields).toContain('phoneNumber');
      expect(fields).toContain('addresses');
      expect(fields).toContain('paymentMethods');
      expect(fields).toContain('wishlist');
      expect(fields).toContain('preferences');
      expect(fields).not.toContain('roles');
      expect(fields).not.toContain('tier');
      expect(fields).not.toContain('email'); // email not in user update fields
    });

    it('should return all updateable fields for admin', () => {
      const fields = UserValidationUtility.getAllowedUpdateFields(true);

      expect(fields).toContain('firstName');
      expect(fields).toContain('roles');
      expect(fields).toContain('tier');
      expect(fields).toContain('isActive');
      expect(fields).toContain('isEmailVerified');
      expect(fields).toContain('email');
    });

    it('should not include protected fields for admin', () => {
      const fields = UserValidationUtility.getAllowedUpdateFields(true);

      expect(fields).not.toContain('_id');
      expect(fields).not.toContain('__v');
      expect(fields).not.toContain('createdAt');
    });

    it('should return an array', () => {
      const userFields = UserValidationUtility.getAllowedUpdateFields(false);
      const adminFields = UserValidationUtility.getAllowedUpdateFields(true);

      expect(Array.isArray(userFields)).toBe(true);
      expect(Array.isArray(adminFields)).toBe(true);
    });

    it('should have more fields for admin than user', () => {
      const userFields = UserValidationUtility.getAllowedUpdateFields(false);
      const adminFields = UserValidationUtility.getAllowedUpdateFields(true);

      expect(adminFields.length).toBeGreaterThan(userFields.length);
    });
  });

  describe('validateForCreate', () => {
    it('should require email for create', () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      const result = UserValidationUtility.validateForCreate(userData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should accept email and password for create', () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        password: 'password123',
      };

      const result = UserValidationUtility.validateForCreate(userData);

      expect(result.valid).toBe(true);
    });

    it('should require password when email is provided', () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const result = UserValidationUtility.validateForCreate(userData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('should validate nested data during create', () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        addresses: [{ street: '123 Main St' }],
      };

      const result = UserValidationUtility.validateForCreate(userData);

      expect(userAddressValidator.validateAddress).toHaveBeenCalledWith(userData.addresses[0]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateForUpdate', () => {
    it('should allow partial updates', () => {
      const userData = {
        firstName: 'Jane',
      };

      const result = UserValidationUtility.validateForUpdate(userData, { isAdmin: false });

      expect(result.valid).toBe(true);
    });

    it('should not require email for update', () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const result = UserValidationUtility.validateForUpdate(userData, { isAdmin: false });

      expect(result.valid).toBe(true);
    });

    it('should not require password for update', () => {
      const userData = {
        firstName: 'Jane',
      };

      const result = UserValidationUtility.validateForUpdate(userData, { isAdmin: false });

      expect(result.valid).toBe(true);
    });

    it('should validate provided fields', () => {
      const userData = {
        email: 'invalid-email',
      };

      userValidator.isValidEmail.mockReturnValue(false);

      const result = UserValidationUtility.validateForUpdate(userData, { isAdmin: false });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Email is required, must be valid');
    });

    it('should allow admin fields for admin users', () => {
      const userData = {
        roles: ['admin'],
        tier: 'platinum',
      };

      const result = UserValidationUtility.validateForUpdate(userData, { isAdmin: true });

      expect(result.valid).toBe(true);
    });

    it('should validate nested updates', () => {
      const userData = {
        addresses: [{ street: 'New Street' }],
      };

      const result = UserValidationUtility.validateForUpdate(userData, { isAdmin: false });

      expect(userAddressValidator.validateAddress).toHaveBeenCalledWith(userData.addresses[0]);
      expect(result.valid).toBe(true);
    });
  });

  describe('throwIfInvalid', () => {
    it('should not throw for valid data', () => {
      const validationResult = {
        valid: true,
        errors: [],
      };

      expect(() => {
        UserValidationUtility.throwIfInvalid(validationResult);
      }).not.toThrow();
    });

    it('should throw error for invalid data', () => {
      const validationResult = {
        valid: false,
        errors: ['Invalid email'],
      };

      expect(() => {
        UserValidationUtility.throwIfInvalid(validationResult);
      }).toThrow(ErrorResponse);
    });

    it('should throw error with proper structure', () => {
      const validationResult = {
        valid: false,
        errors: ['Invalid email', 'Password too short'],
      };

      try {
        UserValidationUtility.throwIfInvalid(validationResult);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('Invalid email');
        expect(error.message).toContain('Password too short');
      }
    });

    it('should include all errors in thrown error message', () => {
      const validationResult = {
        valid: false,
        errors: ['Error 1', 'Error 2', 'Error 3'],
      };

      try {
        UserValidationUtility.throwIfInvalid(validationResult);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Error 1');
        expect(error.message).toContain('Error 2');
        expect(error.message).toContain('Error 3');
      }
    });

    it('should use custom error code', () => {
      const validationResult = {
        valid: false,
        errors: ['Invalid data'],
      };

      try {
        UserValidationUtility.throwIfInvalid(validationResult, 'CUSTOM_ERROR_CODE');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.code).toBe('CUSTOM_ERROR_CODE');
      }
    });
  });

  describe('handleValidationError', () => {
    it('should return null for valid data', () => {
      const validationResult = {
        valid: true,
        errors: [],
      };
      const next = jest.fn();

      const result = UserValidationUtility.handleValidationError(validationResult, next);

      expect(result).toBeNull();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error for invalid data', () => {
      const validationResult = {
        valid: false,
        errors: ['Invalid email'],
      };
      const next = jest.fn();

      UserValidationUtility.handleValidationError(validationResult, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
    });

    it('should include all errors in the error message', () => {
      const validationResult = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
      };
      const next = jest.fn();

      UserValidationUtility.handleValidationError(validationResult, next);

      expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
      expect(next.mock.calls[0][0].message).toContain('Error 1');
      expect(next.mock.calls[0][0].message).toContain('Error 2');
    });

    it('should use custom error code', () => {
      const validationResult = {
        valid: false,
        errors: ['Invalid data'],
      };
      const next = jest.fn();

      UserValidationUtility.handleValidationError(validationResult, next, 'CUSTOM_ERROR');

      expect(next.mock.calls[0][0].code).toBe('CUSTOM_ERROR');
    });
  });
});
