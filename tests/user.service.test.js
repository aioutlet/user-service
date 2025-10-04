import * as userService from '../src/services/user.service.js';
import User from '../src/models/user.model.js';
import UserValidationUtility from '../src/validators/user.validation.utility.js';
import userValidator from '../src/validators/user.validator.js';
import ErrorResponse from '../src/utils/ErrorResponse.js';

jest.mock('../src/models/user.model.js');
jest.mock('../src/validators/user.validation.utility.js');
jest.mock('../src/validators/user.validator.js');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserById('123');

      expect(User.findById).toHaveBeenCalledWith('123', '-password');
      expect(result).toEqual(mockUser);
    });

    it('should exclude password field', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      await userService.getUserById('123');

      expect(User.findById).toHaveBeenCalledWith('123', '-password');
    });

    it('should throw 404 when user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.getUserById('123')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserById('123')).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should propagate database errors', async () => {
      User.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.getUserById('123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      UserValidationUtility.filterAllowedFields = jest.fn((fields) => fields);
      UserValidationUtility.validateForUpdate = jest.fn(() => ({ valid: true, errors: [] }));
      UserValidationUtility.throwIfInvalid = jest.fn();
    });

    it('should update allowed fields for regular user', async () => {
      const updateFields = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const mockUpdatedUser = {
        _id: '123',
        ...updateFields,
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser('123', updateFields, { isAdmin: false });

      expect(UserValidationUtility.filterAllowedFields).toHaveBeenCalledWith(updateFields, false);
      expect(UserValidationUtility.validateForUpdate).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('123', updateFields, { new: true });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update admin-only fields for admin', async () => {
      const updateFields = {
        roles: ['admin'],
        tier: 'platinum',
      };
      const mockUpdatedUser = {
        _id: '123',
        ...updateFields,
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser('123', updateFields, { isAdmin: true });

      expect(UserValidationUtility.filterAllowedFields).toHaveBeenCalledWith(updateFields, true);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should filter out disallowed fields', async () => {
      const updateFields = {
        firstName: 'Jane',
        roles: ['admin'], // Will be filtered out for non-admin
      };
      const filteredFields = { firstName: 'Jane' };

      UserValidationUtility.filterAllowedFields = jest.fn().mockReturnValue(filteredFields);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: '123', ...filteredFields });

      await userService.updateUser('123', updateFields, { isAdmin: false });

      expect(UserValidationUtility.filterAllowedFields).toHaveBeenCalledWith(updateFields, false);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('123', filteredFields, { new: true });
    });

    it('should throw error when no valid fields provided', async () => {
      UserValidationUtility.filterAllowedFields = jest.fn().mockReturnValue({});

      await expect(userService.updateUser('123', { invalid: 'field' }, { isAdmin: false })).rejects.toThrow(
        ErrorResponse
      );
      await expect(userService.updateUser('123', { invalid: 'field' }, { isAdmin: false })).rejects.toMatchObject({
        message: 'No updatable fields provided',
        statusCode: 400,
        code: 'NO_UPDATABLE_FIELDS',
      });
    });

    it('should validate before updating', async () => {
      const updateFields = { firstName: 'Jane' };

      UserValidationUtility.validateForUpdate = jest.fn(() => ({ valid: true, errors: [] }));
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: '123', ...updateFields });

      await userService.updateUser('123', updateFields, { isAdmin: false });

      expect(UserValidationUtility.validateForUpdate).toHaveBeenCalledWith(updateFields, { isAdmin: false });
      expect(UserValidationUtility.throwIfInvalid).toHaveBeenCalled();
    });

    it('should handle password updates separately', async () => {
      const updateFields = {
        firstName: 'Jane',
        password: 'newPassword123',
      };
      const mockUser = {
        _id: '123',
        password: 'oldHashedPassword',
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({ _id: '123', firstName: 'Jane' });

      const result = await userService.updateUser('123', updateFields, { isAdmin: false });

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(mockUser.password).toBe('newPassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('123', { firstName: 'Jane' }, { new: true });
    });

    it('should prevent social account password updates for non-admin', async () => {
      const updateFields = { password: 'newPassword123' };
      const mockUser = {
        _id: '123',
        password: null, // Social account has no local password
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      await expect(userService.updateUser('123', updateFields, { isAdmin: false })).rejects.toThrow(ErrorResponse);
      await expect(userService.updateUser('123', updateFields, { isAdmin: false })).rejects.toMatchObject({
        message: 'Password update not allowed for social login accounts',
        statusCode: 400,
        code: 'NO_LOCAL_PASSWORD',
      });
    });

    it('should allow admin to set password for social account', async () => {
      const updateFields = { password: 'newPassword123' };
      const mockUser = {
        _id: '123',
        password: null, // Social account
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.updateUser('123', updateFields, { isAdmin: true });

      expect(mockUser.password).toBe('newPassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password updated successfully' });
    });

    it('should return message when only password is updated', async () => {
      const updateFields = { password: 'newPassword123' };
      const mockUser = {
        _id: '123',
        password: 'oldPassword',
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.updateUser('123', updateFields, { isAdmin: false });

      expect(result).toEqual({ message: 'Password updated successfully' });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw 404 when user not found during password update', async () => {
      const updateFields = { password: 'newPassword123' };

      User.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.updateUser('123', updateFields, { isAdmin: false })).rejects.toThrow(ErrorResponse);
      await expect(userService.updateUser('123', updateFields, { isAdmin: false })).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should throw 404 when user not found during regular update', async () => {
      const updateFields = { firstName: 'Jane' };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(userService.updateUser('123', updateFields, { isAdmin: false })).rejects.toThrow(ErrorResponse);
      await expect(userService.updateUser('123', updateFields, { isAdmin: false })).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should return updated user with new fields', async () => {
      const updateFields = {
        firstName: 'Jane',
        lastName: 'Smith',
        displayName: 'Jane S.',
      };
      const mockUpdatedUser = {
        _id: '123',
        email: 'test@example.com',
        ...updateFields,
      };

      User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser('123', updateFields, { isAdmin: false });

      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user when found', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
      };

      User.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);

      await userService.deleteUser('123');

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
    });

    it('should throw 404 when user not found', async () => {
      User.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await expect(userService.deleteUser('123')).rejects.toThrow(ErrorResponse);
      await expect(userService.deleteUser('123')).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should propagate database errors', async () => {
      User.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.deleteUser('123')).rejects.toThrow('Database error');
    });
  });

  describe('getUserByEmail', () => {
    beforeEach(() => {
      userValidator.isValidEmail = jest.fn();
    });

    it('should return user for valid email', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        firstName: 'John',
      };

      userValidator.isValidEmail.mockReturnValue(true);
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(userValidator.isValidEmail).toHaveBeenCalledWith('test@example.com');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should throw error for missing email', async () => {
      await expect(userService.getUserByEmail('')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserByEmail('')).rejects.toMatchObject({
        message: 'Email is required',
        statusCode: 400,
        code: 'EMAIL_REQUIRED',
      });
    });

    it('should throw error for null email', async () => {
      await expect(userService.getUserByEmail(null)).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserByEmail(null)).rejects.toMatchObject({
        message: 'Email is required',
        statusCode: 400,
        code: 'EMAIL_REQUIRED',
      });
    });

    it('should throw error for undefined email', async () => {
      await expect(userService.getUserByEmail(undefined)).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserByEmail(undefined)).rejects.toMatchObject({
        message: 'Email is required',
        statusCode: 400,
        code: 'EMAIL_REQUIRED',
      });
    });

    it('should throw error for invalid email format', async () => {
      userValidator.isValidEmail.mockReturnValue(false);

      await expect(userService.getUserByEmail('invalid-email')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserByEmail('invalid-email')).rejects.toMatchObject({
        message: 'Invalid email',
        statusCode: 400,
        code: 'INVALID_EMAIL',
      });
    });

    it('should throw 404 when user not found', async () => {
      userValidator.isValidEmail.mockReturnValue(true);
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(userService.getUserByEmail('notfound@example.com')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserByEmail('notfound@example.com')).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });
  });

  describe('getUserBySocial', () => {
    it('should return user for valid provider and id', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        social: {
          google: { id: 'google123' },
        },
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserBySocial('google', 'google123');

      expect(User.findOne).toHaveBeenCalledWith({ 'social.google.id': 'google123' });
      expect(result).toEqual(mockUser);
    });

    it('should throw error for missing provider', async () => {
      await expect(userService.getUserBySocial('', 'id123')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserBySocial('', 'id123')).rejects.toMatchObject({
        message: 'Provider and id are required',
        statusCode: 400,
        code: 'PROVIDER_ID_REQUIRED',
      });
    });

    it('should throw error for missing id', async () => {
      await expect(userService.getUserBySocial('google', '')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserBySocial('google', '')).rejects.toMatchObject({
        message: 'Provider and id are required',
        statusCode: 400,
        code: 'PROVIDER_ID_REQUIRED',
      });
    });

    it('should throw error for null provider', async () => {
      await expect(userService.getUserBySocial(null, 'id123')).rejects.toThrow(ErrorResponse);
    });

    it('should throw error for null id', async () => {
      await expect(userService.getUserBySocial('google', null)).rejects.toThrow(ErrorResponse);
    });

    it('should work with different providers', async () => {
      const providers = ['google', 'facebook', 'twitter', 'linkedin', 'apple'];

      for (const provider of providers) {
        const mockUser = {
          _id: '123',
          social: { [provider]: { id: `${provider}123` } },
        };

        User.findOne = jest.fn().mockResolvedValue(mockUser);

        const result = await userService.getUserBySocial(provider, `${provider}123`);

        expect(User.findOne).toHaveBeenCalledWith({ [`social.${provider}.id`]: `${provider}123` });
        expect(result).toEqual(mockUser);
      }
    });

    it('should throw 404 when user not found', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(userService.getUserBySocial('google', 'nonexistent')).rejects.toThrow(ErrorResponse);
      await expect(userService.getUserBySocial('google', 'nonexistent')).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('should handle special characters in social id', async () => {
      const specialId = 'user-123_456.789';
      const mockUser = {
        _id: '123',
        social: { google: { id: specialId } },
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await userService.getUserBySocial('google', specialId);

      expect(User.findOne).toHaveBeenCalledWith({ 'social.google.id': specialId });
    });
  });
});
