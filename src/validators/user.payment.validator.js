// User payment validation utility
const userPaymentValidator = {
  isValidCardType(cardType) {
    const validCardTypes = ['visa', 'mastercard', 'amex', 'discover'];
    return typeof cardType === 'string' && validCardTypes.includes(cardType.trim().toLowerCase());
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

  validatePaymentMethod(payment) {
    const errors = [];

    // Normalize payment data from frontend
    const normalizedPayment = { ...payment };

    // Extract last4 from cardNumber if present
    if (payment.cardNumber && !payment.last4) {
      const cleanCardNumber = payment.cardNumber.replace(/\s/g, '');
      if (cleanCardNumber.length >= 4) {
        normalizedPayment.last4 = cleanCardNumber.slice(-4);
      }
    }

    // Convert expiryMonth from string to number if needed
    if (typeof normalizedPayment.expiryMonth === 'string') {
      normalizedPayment.expiryMonth = parseInt(normalizedPayment.expiryMonth, 10);
    }

    // Convert expiryYear from string to number if needed
    if (typeof normalizedPayment.expiryYear === 'string') {
      normalizedPayment.expiryYear = parseInt(normalizedPayment.expiryYear, 10);
    }

    // Validate card type
    if (!this.isValidCardType(normalizedPayment.cardType)) {
      errors.push('Card type must be one of: visa, mastercard, amex, discover');
    }

    // Validate last4
    if (!this.isValidLast4(normalizedPayment.last4)) {
      errors.push('Last 4 digits must be exactly 4 numeric characters');
    }

    // Validate expiry date
    if (!this.isValidExpiryMonth(normalizedPayment.expiryMonth)) {
      errors.push('Expiry month must be a number between 1 and 12');
    }

    if (!this.isValidExpiryYear(normalizedPayment.expiryYear)) {
      errors.push('Expiry year must be a valid year (current year or future)');
    }

    if (
      normalizedPayment.expiryMonth &&
      normalizedPayment.expiryYear &&
      !this.isExpiryDateValid(normalizedPayment.expiryMonth, normalizedPayment.expiryYear)
    ) {
      errors.push('Card expiry date cannot be in the past');
    }

    if (!this.isValidCardholderName(normalizedPayment.cardholderName)) {
      errors.push(
        'Cardholder name is required and must contain only letters, spaces, hyphens, apostrophes, and periods'
      );
    }

    if (normalizedPayment.isDefault !== undefined && !this.isValidIsDefault(normalizedPayment.isDefault)) {
      errors.push('isDefault must be a boolean value');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      normalizedPayment: normalizedPayment, // Return normalized version for use in controller
    };
  },
};

export default userPaymentValidator;
