import User from '../models/user.model.js';
import userValidator from '../validators/user.validator.js';
import { createError } from '../utils/error.js';

export async function getUserById(userId) {
  const user = await User.findById(userId, '-password');
  if (!user) throw createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
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
    throw createError({ status: 400, code: 'NO_UPDATABLE_FIELDS', message: 'No updatable fields provided' });
  }
  if ('name' in update && !userValidator.isValidName(update.name)) {
    throw createError({ status: 400, code: 'INVALID_NAME', message: 'Name is invalid' });
  }
  if ('roles' in update && !userValidator.isValidRoles(update.roles)) {
    throw createError({ status: 400, code: 'INVALID_ROLES', message: 'Roles must be an array of non-empty strings.' });
  }
  if ('email' in update && !userValidator.isValidEmail(update.email)) {
    throw createError({ status: 400, code: 'INVALID_EMAIL', message: 'Email is invalid' });
  }
  if ('password' in update) {
    const passwordValidation = userValidator.isValidPassword(update.password);
    if (!passwordValidation.valid) {
      throw createError({ status: 400, code: 'INVALID_PASSWORD', message: passwordValidation.error });
    }
    const user = await User.findById(userId);
    if (!user) throw createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
    if (!user.password && !isAdmin) {
      throw createError({
        status: 400,
        code: 'NO_LOCAL_PASSWORD',
        message: 'Password update not allowed for social login accounts',
      });
    }
    user.password = update.password;
    await user.save();
    delete update.password;
    if (Object.keys(update).length === 0) {
      return { message: 'Password updated successfully' };
    }
  }
  const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
  if (!updatedUser) throw createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
  return updatedUser;
}

export async function deleteUser(userId) {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
  return;
}

export async function getUserByEmail(email) {
  if (!email) throw createError({ status: 400, code: 'EMAIL_REQUIRED', message: 'Email is required' });
  if (!userValidator.isValidEmail(email))
    throw createError({ status: 400, code: 'INVALID_EMAIL', message: 'Invalid email' });
  const user = await User.findOne({ email });
  if (!user) throw createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
  return user;
}

export async function getUserBySocial(provider, id) {
  if (!provider || !id)
    throw createError({ status: 400, code: 'PROVIDER_ID_REQUIRED', message: 'Provider and id are required' });
  const query = { [`social.${provider}.id`]: id };
  const user = await User.findOne(query);
  if (!user) throw createError({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
  return user;
}
