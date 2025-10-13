import mongoose from 'mongoose';

// User input validation utility
const userValidator = {
  isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  },
  isValidEmail(email) {
    // Must be string, trimmed, valid email, min 5, max 100
    return (
      typeof email === 'string' &&
      email.trim().length >= 5 &&
      email.trim().length <= 100 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    );
  },
  isValidPassword(password) {
    if (typeof password !== 'string') {
      return { valid: false, error: 'Password must be a string' };
    }
    if (password.trim().length < 6 || password.trim().length > 25) {
      return { valid: false, error: 'Password must be between 6 and 25 characters' };
    }
    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, error: 'Password must contain at least one letter' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, error: 'Password must contain at least one number' };
    }
    return { valid: true };
  },
  isValidFirstName(firstName) {
    // Optional field, but if provided must be valid
    if (!firstName) {
      return true;
    }
    return (
      typeof firstName === 'string' &&
      firstName.trim().length >= 2 && // Minimum 2 characters
      firstName.trim().length <= 50 &&
      /^[a-zA-Z\s\-'\.]+$/.test(firstName.trim())
    );
  },
  isValidLastName(lastName) {
    // Optional field, but if provided must be valid
    if (!lastName) {
      return true;
    }
    return (
      typeof lastName === 'string' &&
      lastName.trim().length > 0 &&
      lastName.trim().length <= 50 &&
      /^[a-zA-Z\s\-'\.]+$/.test(lastName.trim())
    );
  },
  isValidDisplayName(displayName) {
    // Optional field, but if provided must be valid
    if (!displayName) {
      return true;
    }
    return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 100;
  },
  isValidPhoneNumber(phoneNumber) {
    // Optional field, but if provided must be valid
    if (!phoneNumber) {
      return true;
    }

    if (typeof phoneNumber !== 'string') {
      return false;
    }

    const trimmed = phoneNumber.trim();

    // Check length (allowing for international format with + and spaces/dashes)
    if (trimmed.length < 7 || trimmed.length > 20) {
      return false;
    }

    // Allow digits, spaces, hyphens, parentheses, and leading +
    // Examples: +1234567890, (123) 456-7890, +44 20 7123 4567, 123-456-7890
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;

    if (!phoneRegex.test(trimmed)) {
      return false;
    }

    // Ensure there are at least 7 digits (minimum for any valid phone number)
    const digitCount = (trimmed.match(/\d/g) || []).length;
    return digitCount >= 7 && digitCount <= 15;
  },
  isValidRoles(roles) {
    // Must be array of valid role strings
    const validRoles = ['customer', 'admin', 'vendor', 'moderator', 'support'];
    return (
      Array.isArray(roles) &&
      roles.length > 0 &&
      roles.every(
        (role) => typeof role === 'string' && role.trim().length > 0 && validRoles.includes(role.trim().toLowerCase()),
      )
    );
  },
  isValidTier(tier) {
    // Must be a valid tier string
    const validTiers = ['basic', 'premium', 'gold', 'platinum'];
    return typeof tier === 'string' && tier.trim().length > 0 && validTiers.includes(tier.trim().toLowerCase());
  },
};

export default userValidator;
