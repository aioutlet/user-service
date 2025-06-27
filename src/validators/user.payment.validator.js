// User payment validation utility
const userPaymentValidator = {
  isValidPaymentType(type) {
    const validTypes = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'other'];
    return typeof type === 'string' && validTypes.includes(type.trim().toLowerCase());
  },

  isValidProvider(provider) {
    const validProviders = ['visa', 'mastercard', 'amex', 'discover', 'paypal', 'stripe', 'square', 'other'];
    return typeof provider === 'string' && validProviders.includes(provider.trim().toLowerCase());
  },

  isValidLast4(last4) {
    return typeof last4 === 'string' && last4.trim().length === 4 && /^\d{4}$/.test(last4.trim());
  },

  isValidExpiryMonth(month) {
    return typeof month === 'number' && Number.isInteger(month) && month >= 1 && month <= 12;
  },

  isValidExpiryYear(year) {
    const currentYear = new Date().getFullYear();
    return (
      typeof year === 'number' && Number.isInteger(year) && year >= currentYear && year <= currentYear + 20 // Max 20 years in the future
    );
  },

  isValidCardholderName(name) {
    return (
      typeof name === 'string' &&
      name.trim().length > 0 &&
      name.trim().length <= 100 &&
      /^[a-zA-Z\s\-'\.]+$/.test(name.trim())
    );
  },

  isValidIsDefault(isDefault) {
    return typeof isDefault === 'boolean';
  },

  isValidIsActive(isActive) {
    return typeof isActive === 'boolean';
  },

  isValidNickname(nickname) {
    // Optional field, but if provided must be valid
    if (!nickname) return true;
    return typeof nickname === 'string' && nickname.trim().length > 0 && nickname.trim().length <= 50;
  },

  isExpiryDateValid(month, year) {
    if (!this.isValidExpiryMonth(month) || !this.isValidExpiryYear(year)) {
      return false;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    // If year is in the future, it's valid
    if (year > currentYear) {
      return true;
    }

    // If year is current year, check if month is current or future
    if (year === currentYear) {
      return month >= currentMonth;
    }

    // Year is in the past
    return false;
  },

  validatePaymentTypeAndProvider(type, provider) {
    const errors = [];

    // Check if payment type and provider combination makes sense
    if (type === 'paypal' && provider !== 'paypal') {
      errors.push('PayPal payment type must use PayPal as provider');
    }

    if (type === 'apple_pay' && !['visa', 'mastercard', 'amex', 'discover', 'other'].includes(provider)) {
      errors.push('Apple Pay must be associated with a valid card provider');
    }

    if (type === 'google_pay' && !['visa', 'mastercard', 'amex', 'discover', 'other'].includes(provider)) {
      errors.push('Google Pay must be associated with a valid card provider');
    }

    if (type === 'bank_transfer' && provider !== 'other') {
      errors.push('Bank transfer should use "other" as provider');
    }

    return errors;
  },

  validatePaymentMethod(payment) {
    const errors = [];

    if (!this.isValidPaymentType(payment.type)) {
      errors.push(
        'Payment type must be one of: credit_card, debit_card, paypal, apple_pay, google_pay, bank_transfer, other'
      );
    }

    if (!this.isValidProvider(payment.provider)) {
      errors.push('Provider must be one of: visa, mastercard, amex, discover, paypal, stripe, square, other');
    }

    // Validate type and provider combination
    if (payment.type && payment.provider) {
      const typeProviderErrors = this.validatePaymentTypeAndProvider(payment.type, payment.provider);
      errors.push(...typeProviderErrors);
    }

    if (!this.isValidLast4(payment.last4)) {
      errors.push('Last 4 digits must be exactly 4 numeric characters');
    }

    // Only validate expiry for card-based payment methods
    const cardBasedTypes = ['credit_card', 'debit_card', 'apple_pay', 'google_pay'];
    if (cardBasedTypes.includes(payment.type)) {
      if (!this.isValidExpiryMonth(payment.expiryMonth)) {
        errors.push('Expiry month must be a number between 1 and 12');
      }

      if (!this.isValidExpiryYear(payment.expiryYear)) {
        errors.push('Expiry year must be a valid year (current year or future)');
      }

      if (
        payment.expiryMonth &&
        payment.expiryYear &&
        !this.isExpiryDateValid(payment.expiryMonth, payment.expiryYear)
      ) {
        errors.push('Card expiry date cannot be in the past');
      }
    }

    if (!this.isValidCardholderName(payment.cardholderName)) {
      errors.push(
        'Cardholder name is required and must contain only letters, spaces, hyphens, apostrophes, and periods'
      );
    }

    if (payment.isDefault !== undefined && !this.isValidIsDefault(payment.isDefault)) {
      errors.push('isDefault must be a boolean value');
    }

    if (payment.isActive !== undefined && !this.isValidIsActive(payment.isActive)) {
      errors.push('isActive must be a boolean value');
    }

    if (!this.isValidNickname(payment.nickname)) {
      errors.push('Payment method nickname must be less than 50 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },
};

export default userPaymentValidator;
