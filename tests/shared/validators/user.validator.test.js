import userValidator from '../../../src/shared/validators/user.validator.js';

describe('User Validator', () => {
  describe('isValidPhoneNumber', () => {
    it('should return true for valid international format with +', () => {
      expect(userValidator.isValidPhoneNumber('+447440292520')).toBe(true);
      expect(userValidator.isValidPhoneNumber('+1234567890')).toBe(true);
      expect(userValidator.isValidPhoneNumber('+44 20 7123 4567')).toBe(true);
    });

    it('should return true for valid US format with parentheses', () => {
      expect(userValidator.isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(userValidator.isValidPhoneNumber('(555)123-4567')).toBe(true);
    });

    it('should return true for valid format with hyphens', () => {
      expect(userValidator.isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(userValidator.isValidPhoneNumber('555-1234')).toBe(true);
    });

    it('should return true for valid format with spaces', () => {
      expect(userValidator.isValidPhoneNumber('123 456 7890')).toBe(true);
      expect(userValidator.isValidPhoneNumber('+1 234 567 8900')).toBe(true);
    });

    it('should return true for plain digit format', () => {
      expect(userValidator.isValidPhoneNumber('1234567890')).toBe(true);
      expect(userValidator.isValidPhoneNumber('5551234')).toBe(true);
    });

    it('should return true for empty/undefined (optional field)', () => {
      expect(userValidator.isValidPhoneNumber('')).toBe(true);
      expect(userValidator.isValidPhoneNumber(null)).toBe(true);
      expect(userValidator.isValidPhoneNumber(undefined)).toBe(true);
    });

    it('should return false if not a string', () => {
      expect(userValidator.isValidPhoneNumber(1234567890)).toBe(false);
      expect(userValidator.isValidPhoneNumber({})).toBe(false);
      expect(userValidator.isValidPhoneNumber([])).toBe(false);
    });

    it('should return false if too short (less than 7 digits)', () => {
      expect(userValidator.isValidPhoneNumber('123456')).toBe(false);
      expect(userValidator.isValidPhoneNumber('12-34')).toBe(false);
      expect(userValidator.isValidPhoneNumber('+1 234')).toBe(false);
    });

    it('should return false if too long (more than 20 characters)', () => {
      expect(userValidator.isValidPhoneNumber('+123456789012345678901')).toBe(false);
      expect(userValidator.isValidPhoneNumber('1234567890123456789012345')).toBe(false);
    });

    it('should return false if contains invalid characters', () => {
      expect(userValidator.isValidPhoneNumber('123-abc-7890')).toBe(false);
      expect(userValidator.isValidPhoneNumber('123@456#7890')).toBe(false);
      expect(userValidator.isValidPhoneNumber('phone: 1234567890')).toBe(false);
    });

    it('should return false if contains multiple + signs', () => {
      expect(userValidator.isValidPhoneNumber('++1234567890')).toBe(false);
      expect(userValidator.isValidPhoneNumber('+123+4567890')).toBe(false);
    });

    it('should return false if + is not at the beginning', () => {
      expect(userValidator.isValidPhoneNumber('123+4567890')).toBe(false);
      expect(userValidator.isValidPhoneNumber('1234567890+')).toBe(false);
    });

    it('should return false if too many digits (more than 15)', () => {
      expect(userValidator.isValidPhoneNumber('1234567890123456')).toBe(false);
      expect(userValidator.isValidPhoneNumber('+1234567890123456')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(userValidator.isValidEmail('test@example.com')).toBe(true);
      expect(userValidator.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(userValidator.isValidEmail('bad')).toBe(false);
      expect(userValidator.isValidEmail('bad@')).toBe(false);
      expect(userValidator.isValidEmail('@bad.com')).toBe(false);
    });

    it('should return false if too short', () => {
      expect(userValidator.isValidEmail('a@b')).toBe(false);
    });

    it('should return false if too long', () => {
      const longEmail = `${'a'.repeat(100)}@example.com`;
      expect(userValidator.isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return valid:true for valid password', () => {
      const result = userValidator.isValidPassword('Password123');
      expect(result.valid).toBe(true);
    });

    it('should return valid:false if too short', () => {
      const result = userValidator.isValidPassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6');
    });

    it('should return valid:false if too long', () => {
      const result = userValidator.isValidPassword(`${'P'.repeat(26)}1`);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('25');
    });

    it('should return valid:false if no letter', () => {
      const result = userValidator.isValidPassword('123456789');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letter');
    });

    it('should return valid:false if no number', () => {
      const result = userValidator.isValidPassword('PasswordOnly');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should return valid:false if not a string', () => {
      const result = userValidator.isValidPassword(12345678);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('string');
    });
  });

  describe('isValidFirstName', () => {
    it('should return true for valid first name', () => {
      expect(userValidator.isValidFirstName('John')).toBe(true);
      expect(userValidator.isValidFirstName("O'Brien")).toBe(true);
      expect(userValidator.isValidFirstName('Mary-Jane')).toBe(true);
    });

    it('should return true for empty/undefined (optional)', () => {
      expect(userValidator.isValidFirstName('')).toBe(true);
      expect(userValidator.isValidFirstName(null)).toBe(true);
    });

    it('should return false if too short', () => {
      expect(userValidator.isValidFirstName('J')).toBe(false);
    });

    it('should return false if contains invalid characters', () => {
      expect(userValidator.isValidFirstName('John123')).toBe(false);
      expect(userValidator.isValidFirstName('John@')).toBe(false);
    });
  });

  describe('isValidLastName', () => {
    it('should return true for valid last name', () => {
      expect(userValidator.isValidLastName('Smith')).toBe(true);
      expect(userValidator.isValidLastName("O'Connor")).toBe(true);
    });

    it('should return true for empty/undefined (optional)', () => {
      expect(userValidator.isValidLastName('')).toBe(true);
      expect(userValidator.isValidLastName(null)).toBe(true);
    });

    it('should return false if contains invalid characters', () => {
      expect(userValidator.isValidLastName('Smith123')).toBe(false);
    });
  });

  describe('isValidRoles', () => {
    it('should return true for valid roles array', () => {
      expect(userValidator.isValidRoles(['customer'])).toBe(true);
      expect(userValidator.isValidRoles(['customer', 'admin'])).toBe(true);
    });

    it('should return false for invalid role', () => {
      expect(userValidator.isValidRoles(['invalid'])).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(userValidator.isValidRoles([])).toBe(false);
    });

    it('should return false if not an array', () => {
      expect(userValidator.isValidRoles('customer')).toBe(false);
    });
  });

  describe('isValidTier', () => {
    it('should return true for valid tier', () => {
      expect(userValidator.isValidTier('basic')).toBe(true);
      expect(userValidator.isValidTier('premium')).toBe(true);
      expect(userValidator.isValidTier('gold')).toBe(true);
      expect(userValidator.isValidTier('platinum')).toBe(true);
    });

    it('should return false for invalid tier', () => {
      expect(userValidator.isValidTier('invalid')).toBe(false);
      expect(userValidator.isValidTier('diamond')).toBe(false);
    });

    it('should return false if not a string', () => {
      expect(userValidator.isValidTier(123)).toBe(false);
    });
  });
});
