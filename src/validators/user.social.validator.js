// User social validation utility
const userSocialValidator = {
  isValidSocialId(id) {
    // Social IDs can be strings or numbers, but must be non-empty when provided
    if (!id) return true; // Optional field
    return typeof id === 'string' && id.trim().length > 0 && id.trim().length <= 100;
  },

  isValidSocialEmail(email) {
    // Optional field, but if provided must be valid email
    if (!email) return true;
    return (
      typeof email === 'string' &&
      email.trim().length >= 5 &&
      email.trim().length <= 100 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    );
  },

  isValidSocialUsername(username) {
    // Optional field, but if provided must be valid username
    if (!username) return true;
    return (
      typeof username === 'string' &&
      username.trim().length > 0 &&
      username.trim().length <= 50 &&
      /^[a-zA-Z0-9_\-\.]+$/.test(username.trim())
    );
  },

  validateGoogleAccount(google) {
    if (!google) return { valid: true, errors: [] };

    const errors = [];

    if (google.id && !this.isValidSocialId(google.id)) {
      errors.push('Google ID must be a non-empty string');
    }

    if (google.email && !this.isValidSocialEmail(google.email)) {
      errors.push('Google email must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  validateFacebookAccount(facebook) {
    if (!facebook) return { valid: true, errors: [] };

    const errors = [];

    if (facebook.id && !this.isValidSocialId(facebook.id)) {
      errors.push('Facebook ID must be a non-empty string');
    }

    if (facebook.email && !this.isValidSocialEmail(facebook.email)) {
      errors.push('Facebook email must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  validateTwitterAccount(twitter) {
    if (!twitter) return { valid: true, errors: [] };

    const errors = [];

    if (twitter.id && !this.isValidSocialId(twitter.id)) {
      errors.push('Twitter ID must be a non-empty string');
    }

    if (twitter.username && !this.isValidSocialUsername(twitter.username)) {
      errors.push('Twitter username must contain only letters, numbers, underscores, hyphens, and periods');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  validateLinkedInAccount(linkedin) {
    if (!linkedin) return { valid: true, errors: [] };

    const errors = [];

    if (linkedin.id && !this.isValidSocialId(linkedin.id)) {
      errors.push('LinkedIn ID must be a non-empty string');
    }

    if (linkedin.email && !this.isValidSocialEmail(linkedin.email)) {
      errors.push('LinkedIn email must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  validateAppleAccount(apple) {
    if (!apple) return { valid: true, errors: [] };

    const errors = [];

    if (apple.id && !this.isValidSocialId(apple.id)) {
      errors.push('Apple ID must be a non-empty string');
    }

    if (apple.email && !this.isValidSocialEmail(apple.email)) {
      errors.push('Apple email must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  validateSocialAccounts(social) {
    if (!social) return { valid: true, errors: [] };

    const allErrors = [];

    // Validate each social account
    const googleValidation = this.validateGoogleAccount(social.google);
    const facebookValidation = this.validateFacebookAccount(social.facebook);
    const twitterValidation = this.validateTwitterAccount(social.twitter);
    const linkedinValidation = this.validateLinkedInAccount(social.linkedin);
    const appleValidation = this.validateAppleAccount(social.apple);

    // Collect all errors
    allErrors.push(...googleValidation.errors);
    allErrors.push(...facebookValidation.errors);
    allErrors.push(...twitterValidation.errors);
    allErrors.push(...linkedinValidation.errors);
    allErrors.push(...appleValidation.errors);

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  },
};

export default userSocialValidator;
