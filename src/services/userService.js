import User from '../models/user.model.js';
import userValidator from '../validators/user.validator.js';
import ErrorResponse from '../utils/ErrorResponse.js';

export async function getUserById(userId) {
  const user = await User.findById(userId, '-password');
  if (!user) throw new ErrorResponse('User not found', 404, 'USER_NOT_FOUND');
  return user;
}

export async function updateUser(userId, updateFields, { isAdmin = false } = {}) {
  const allowedFields = isAdmin
    ? ['name', 'email', 'isEmailVerified', 'isActive', 'roles', 'social', 'password']
    : ['name', 'isEmailVerified', 'isActive', 'password'];
  const update = {};
  for (const field of allowedFields) {
    if (field in updateFields) update[field] = updateFields[field];
  }
  if (Object.keys(update).length === 0) {
    throw new ErrorResponse('No updatable fields provided', 400, 'NO_UPDATABLE_FIELDS');
  }
  if ('name' in update && !userValidator.isValidName(update.name)) {
    throw new ErrorResponse('Name is invalid', 400, 'INVALID_NAME');
  }
  if ('roles' in update && !userValidator.isValidRoles(update.roles)) {
    throw new ErrorResponse('Roles must be an array of non-empty strings.', 400, 'INVALID_ROLES');
  }
  if ('email' in update && !userValidator.isValidEmail(update.email)) {
    throw new ErrorResponse('Email is invalid', 400, 'INVALID_EMAIL');
  }
  if ('password' in update) {
    const passwordValidation = userValidator.isValidPassword(update.password);
    if (!passwordValidation.valid) {
      throw new ErrorResponse(passwordValidation.error, 400, 'INVALID_PASSWORD');
    }
    const user = await User.findById(userId);
    if (!user) throw new ErrorResponse('User not found', 404, 'USER_NOT_FOUND');
    if (!user.password && !isAdmin) {
      throw new ErrorResponse('Password update not allowed for social login accounts', 400, 'NO_LOCAL_PASSWORD');
    }
    user.password = update.password;
    await user.save();
    delete update.password;
    if (Object.keys(update).length === 0) {
      return { message: 'Password updated successfully' };
    }
  }
  const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
  if (!updatedUser) throw new ErrorResponse('User not found', 404, 'USER_NOT_FOUND');
  return updatedUser;
}

export async function deleteUser(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new ErrorResponse('User not found', 404, 'USER_NOT_FOUND');
  return;
}

export async function getUserByEmail(email) {
  if (!email) throw new ErrorResponse('Email is required', 400, 'EMAIL_REQUIRED');
  if (!userValidator.isValidEmail(email)) throw new ErrorResponse('Invalid email', 400, 'INVALID_EMAIL');
  const user = await User.findOne({ email });
  if (!user) throw new ErrorResponse('User not found', 404, 'USER_NOT_FOUND');
  return user;
}

export async function getUserBySocial(provider, id) {
  if (!provider || !id) throw new ErrorResponse('Provider and id are required', 400, 'PROVIDER_ID_REQUIRED');
  const query = { [`social.${provider}.id`]: id };
  const user = await User.findOne(query);
  if (!user) throw new ErrorResponse('User not found', 404, 'USER_NOT_FOUND');
  return user;
}
