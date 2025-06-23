// User input validation utility
const userValidator = {
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
  isValidName(name) {
    // Must be string, trimmed, min 2, max 50
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 50;
  },
  isValidRoles(roles) {
    // Must be array of non-empty strings
    return Array.isArray(roles) && roles.every((r) => typeof r === 'string' && r.trim().length > 0);
  },
};

export default userValidator;
