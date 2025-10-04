import userSocialValidator from '../src/validators/user.social.validator.js';

describe('Social Validator', () => {
  describe('isValidSocialId', () => {
    it('should accept valid social IDs', () => {
      expect(userSocialValidator.isValidSocialId('1234567890')).toBe(true);
      expect(userSocialValidator.isValidSocialId('abc123def456')).toBe(true);
      expect(userSocialValidator.isValidSocialId('user-id-with-dashes')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userSocialValidator.isValidSocialId(null)).toBe(true);
      expect(userSocialValidator.isValidSocialId(undefined)).toBe(true);
      expect(userSocialValidator.isValidSocialId('')).toBe(true);
    });

    it('should reject IDs longer than 100 characters', () => {
      const longId = 'A'.repeat(101);
      expect(userSocialValidator.isValidSocialId(longId)).toBe(false);
    });

    it('should accept IDs up to 100 characters', () => {
      const maxId = 'A'.repeat(100);
      expect(userSocialValidator.isValidSocialId(maxId)).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(userSocialValidator.isValidSocialId(123)).toBe(false);
    });
  });

  describe('isValidSocialEmail', () => {
    it('should accept valid email addresses', () => {
      expect(userSocialValidator.isValidSocialEmail('user@example.com')).toBe(true);
      expect(userSocialValidator.isValidSocialEmail('john.doe@company.co.uk')).toBe(true);
      expect(userSocialValidator.isValidSocialEmail('test+tag@domain.com')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userSocialValidator.isValidSocialEmail(null)).toBe(true);
      expect(userSocialValidator.isValidSocialEmail(undefined)).toBe(true);
      expect(userSocialValidator.isValidSocialEmail('')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(userSocialValidator.isValidSocialEmail('notanemail')).toBe(false);
      expect(userSocialValidator.isValidSocialEmail('user@')).toBe(false);
      expect(userSocialValidator.isValidSocialEmail('@domain.com')).toBe(false);
      expect(userSocialValidator.isValidSocialEmail('user @domain.com')).toBe(false);
    });

    it('should reject emails shorter than 5 characters', () => {
      expect(userSocialValidator.isValidSocialEmail('a@b')).toBe(false);
      expect(userSocialValidator.isValidSocialEmail('ab@c')).toBe(false);
    });

    it('should reject emails longer than 100 characters', () => {
      const longEmail = `${'a'.repeat(90)}@domain.com`; // >100 chars
      expect(userSocialValidator.isValidSocialEmail(longEmail)).toBe(false);
    });
  });

  describe('isValidSocialUsername', () => {
    it('should accept valid usernames', () => {
      expect(userSocialValidator.isValidSocialUsername('johndoe')).toBe(true);
      expect(userSocialValidator.isValidSocialUsername('user_123')).toBe(true);
      expect(userSocialValidator.isValidSocialUsername('test-user')).toBe(true);
      expect(userSocialValidator.isValidSocialUsername('user.name')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userSocialValidator.isValidSocialUsername(null)).toBe(true);
      expect(userSocialValidator.isValidSocialUsername(undefined)).toBe(true);
      expect(userSocialValidator.isValidSocialUsername('')).toBe(true);
    });

    it('should reject usernames with invalid characters', () => {
      expect(userSocialValidator.isValidSocialUsername('user@name')).toBe(false);
      expect(userSocialValidator.isValidSocialUsername('test#user')).toBe(false);
      expect(userSocialValidator.isValidSocialUsername('user name')).toBe(false);
    });

    it('should reject usernames longer than 50 characters', () => {
      const longUsername = 'a'.repeat(51);
      expect(userSocialValidator.isValidSocialUsername(longUsername)).toBe(false);
    });

    it('should accept usernames up to 50 characters', () => {
      const maxUsername = 'a'.repeat(50);
      expect(userSocialValidator.isValidSocialUsername(maxUsername)).toBe(true);
    });
  });

  describe('validateGoogleAccount', () => {
    it('should validate a complete valid Google account', () => {
      const validAccount = {
        id: '1234567890',
        email: 'user@gmail.com',
      };

      const result = userSocialValidator.validateGoogleAccount(validAccount);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept Google account with missing id or email (optional fields)', () => {
      const onlyEmail = {
        email: 'user@gmail.com',
      };

      let result = userSocialValidator.validateGoogleAccount(onlyEmail);
      expect(result.valid).toBe(true);

      const onlyId = {
        id: '1234567890',
      };

      result = userSocialValidator.validateGoogleAccount(onlyId);
      expect(result.valid).toBe(true);
    });

    it('should accept empty string id (treated as not provided)', () => {
      const withEmptyId = {
        id: '',
        email: 'user@gmail.com',
      };

      const result = userSocialValidator.validateGoogleAccount(withEmptyId);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject Google account with invalid email', () => {
      const invalid = {
        id: '1234567890',
        email: 'notanemail',
      };

      const result = userSocialValidator.validateGoogleAccount(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Google email must be a valid email address');
    });

    it('should return error for invalid email (empty id is OK)', () => {
      const invalid = {
        id: '',
        email: 'invalid',
      };

      const result = userSocialValidator.validateGoogleAccount(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toEqual(1);
      expect(result.errors).toContain('Google email must be a valid email address');
    });
  });

  describe('validateFacebookAccount', () => {
    it('should validate a complete valid Facebook account', () => {
      const validAccount = {
        id: '9876543210',
        email: 'user@facebook.com',
      };

      const result = userSocialValidator.validateFacebookAccount(validAccount);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept Facebook account with only id or email', () => {
      const onlyId = {
        id: '9876543210',
      };

      const result = userSocialValidator.validateFacebookAccount(onlyId);
      expect(result.valid).toBe(true);
    });

    it('should reject Facebook account with invalid email', () => {
      const invalid = {
        id: '9876543210',
        email: 'notanemail',
      };

      const result = userSocialValidator.validateFacebookAccount(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Facebook email must be a valid email address');
    });
  });

  describe('validateTwitterAccount', () => {
    it('should validate a complete valid Twitter account', () => {
      const validAccount = {
        id: 'twitter123',
        username: 'johndoe',
      };

      const result = userSocialValidator.validateTwitterAccount(validAccount);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept Twitter account with only id or username', () => {
      const onlyId = {
        id: 'twitter123',
      };

      let result = userSocialValidator.validateTwitterAccount(onlyId);
      expect(result.valid).toBe(true);

      const onlyUsername = {
        username: 'johndoe',
      };

      result = userSocialValidator.validateTwitterAccount(onlyUsername);
      expect(result.valid).toBe(true);
    });

    it('should reject Twitter account with invalid username', () => {
      const invalid = {
        id: 'twitter123',
        username: 'invalid@user',
      };

      const result = userSocialValidator.validateTwitterAccount(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Twitter username must contain only letters, numbers, underscores, hyphens, and periods',
      );
    });
  });

  describe('validateLinkedInAccount', () => {
    it('should validate a complete valid LinkedIn account', () => {
      const validAccount = {
        id: 'linkedin456',
        email: 'user@linkedin.com',
      };

      const result = userSocialValidator.validateLinkedInAccount(validAccount);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept LinkedIn account with only id or email', () => {
      const onlyId = {
        id: 'linkedin456',
      };

      const result = userSocialValidator.validateLinkedInAccount(onlyId);
      expect(result.valid).toBe(true);
    });

    it('should reject LinkedIn account with invalid email', () => {
      const invalid = {
        id: 'linkedin456',
        email: 'bademail',
      };

      const result = userSocialValidator.validateLinkedInAccount(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('LinkedIn email must be a valid email address');
    });
  });

  describe('validateAppleAccount', () => {
    it('should validate a complete valid Apple account', () => {
      const validAccount = {
        id: 'apple789',
        email: 'user@icloud.com',
      };

      const result = userSocialValidator.validateAppleAccount(validAccount);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept Apple account with only id or email', () => {
      const onlyId = {
        id: 'apple789',
      };

      const result = userSocialValidator.validateAppleAccount(onlyId);
      expect(result.valid).toBe(true);
    });

    it('should reject Apple account with invalid email', () => {
      const invalid = {
        id: 'apple789',
        email: 'notvalid',
      };

      const result = userSocialValidator.validateAppleAccount(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Apple email must be a valid email address');
    });
  });

  describe('validateSocialAccounts', () => {
    it('should validate all social accounts when present', () => {
      const validAccounts = {
        google: {
          id: 'google123',
          email: 'user@gmail.com',
        },
        facebook: {
          id: 'fb456',
          email: 'user@facebook.com',
        },
        twitter: {
          id: 'tw789',
          username: 'johndoe',
        },
        linkedin: {
          id: 'li012',
          email: 'user@linkedin.com',
        },
        apple: {
          id: 'apple345',
          email: 'user@icloud.com',
        },
      };

      const result = userSocialValidator.validateSocialAccounts(validAccounts);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate when only some providers are present', () => {
      const partialAccounts = {
        google: {
          id: 'google123',
          email: 'user@gmail.com',
        },
        twitter: {
          id: 'tw789',
          username: 'johndoe',
        },
      };

      const result = userSocialValidator.validateSocialAccounts(partialAccounts);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept null or empty object (social accounts are optional)', () => {
      let result = userSocialValidator.validateSocialAccounts(null);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);

      result = userSocialValidator.validateSocialAccounts({});
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should aggregate errors from multiple providers', () => {
      const invalidAccounts = {
        google: {
          id: '',
          email: 'invalid-email',
        },
        facebook: {
          id: 'fb456',
          email: 'bad-email',
        },
      };

      const result = userSocialValidator.validateSocialAccounts(invalidAccounts);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate all providers even with empty strings (treated as not provided)', () => {
      const mixedAccounts = {
        google: {
          id: 'google123',
          email: 'user@gmail.com',
        },
        facebook: {
          id: '',
          email: 'user@facebook.com',
        },
        twitter: {
          id: 'tw789',
          username: 'johndoe',
        },
      };

      const result = userSocialValidator.validateSocialAccounts(mixedAccounts);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle all providers having errors', () => {
      const allInvalid = {
        google: { id: '', email: 'bad' },
        facebook: { id: '', email: 'bad' },
        twitter: { id: '', username: 'bad@user' },
        linkedin: { id: '', email: 'bad' },
        apple: { id: '', email: 'bad' },
      };

      const result = userSocialValidator.validateSocialAccounts(allInvalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    });

    it('should ignore unknown providers', () => {
      const accountsWithUnknown = {
        google: {
          id: 'google123',
          email: 'user@gmail.com',
        },
        unknownProvider: {
          id: 'unknown',
          email: 'test@example.com',
        },
      };

      const result = userSocialValidator.validateSocialAccounts(accountsWithUnknown);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
