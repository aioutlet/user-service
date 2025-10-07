import userPaymentValidator from '../../src/validators/user.payment.validator.js';

describe('Payment Validator', () => {
  describe('isValidCardType', () => {
    it('should accept valid card types', () => {
      expect(userPaymentValidator.isValidCardType('visa')).toBe(true);
      expect(userPaymentValidator.isValidCardType('mastercard')).toBe(true);
      expect(userPaymentValidator.isValidCardType('amex')).toBe(true);
      expect(userPaymentValidator.isValidCardType('discover')).toBe(true);
    });

    it('should accept case-insensitive card types with whitespace', () => {
      expect(userPaymentValidator.isValidCardType(' VISA ')).toBe(true);
      expect(userPaymentValidator.isValidCardType('MasterCard ')).toBe(true);
    });

    it('should reject invalid card types', () => {
      expect(userPaymentValidator.isValidCardType('jcb')).toBe(false);
      expect(userPaymentValidator.isValidCardType('paypal')).toBe(false);
      expect(userPaymentValidator.isValidCardType('unknown')).toBe(false);
      expect(userPaymentValidator.isValidCardType('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(userPaymentValidator.isValidCardType(null)).toBe(false);
      expect(userPaymentValidator.isValidCardType(undefined)).toBe(false);
      expect(userPaymentValidator.isValidCardType(123)).toBe(false);
    });
  });

  describe('isValidLast4', () => {
    it('should accept valid last 4 digits', () => {
      expect(userPaymentValidator.isValidLast4('1234')).toBe(true);
      expect(userPaymentValidator.isValidLast4('0000')).toBe(true);
      expect(userPaymentValidator.isValidLast4('9999')).toBe(true);
    });

    it('should reject non-4-digit strings', () => {
      expect(userPaymentValidator.isValidLast4('123')).toBe(false);
      expect(userPaymentValidator.isValidLast4('12345')).toBe(false);
      expect(userPaymentValidator.isValidLast4('abcd')).toBe(false);
      expect(userPaymentValidator.isValidLast4('12ab')).toBe(false);
    });

    it('should reject empty or whitespace strings', () => {
      expect(userPaymentValidator.isValidLast4('')).toBe(false);
      expect(userPaymentValidator.isValidLast4('   ')).toBe(false);
    });
  });

  describe('isValidExpiryMonth', () => {
    it('should accept valid months', () => {
      for (let month = 1; month <= 12; month++) {
        expect(userPaymentValidator.isValidExpiryMonth(month)).toBe(true);
      }
    });

    it('should reject invalid months', () => {
      expect(userPaymentValidator.isValidExpiryMonth(0)).toBe(false);
      expect(userPaymentValidator.isValidExpiryMonth(13)).toBe(false);
      expect(userPaymentValidator.isValidExpiryMonth(-1)).toBe(false);
      expect(userPaymentValidator.isValidExpiryMonth(100)).toBe(false);
    });

    it('should reject non-integer values', () => {
      expect(userPaymentValidator.isValidExpiryMonth(1.5)).toBe(false);
      expect(userPaymentValidator.isValidExpiryMonth('12')).toBe(false);
      expect(userPaymentValidator.isValidExpiryMonth(null)).toBe(false);
    });
  });

  describe('isValidExpiryYear', () => {
    const currentYear = new Date().getFullYear();

    it('should accept current year', () => {
      expect(userPaymentValidator.isValidExpiryYear(currentYear)).toBe(true);
    });

    it('should accept future years within 20 years', () => {
      expect(userPaymentValidator.isValidExpiryYear(currentYear + 1)).toBe(true);
      expect(userPaymentValidator.isValidExpiryYear(currentYear + 5)).toBe(true);
      expect(userPaymentValidator.isValidExpiryYear(currentYear + 20)).toBe(true);
    });

    it('should reject past years', () => {
      expect(userPaymentValidator.isValidExpiryYear(currentYear - 1)).toBe(false);
      expect(userPaymentValidator.isValidExpiryYear(2020)).toBe(false);
    });

    it('should reject years too far in future', () => {
      expect(userPaymentValidator.isValidExpiryYear(currentYear + 21)).toBe(false);
      expect(userPaymentValidator.isValidExpiryYear(currentYear + 50)).toBe(false);
    });

    it('should reject non-integer values', () => {
      expect(userPaymentValidator.isValidExpiryYear(2025.5)).toBe(false);
      expect(userPaymentValidator.isValidExpiryYear('2025')).toBe(false);
    });
  });

  describe('isValidCardholderName', () => {
    it('should accept valid cardholder names', () => {
      expect(userPaymentValidator.isValidCardholderName('John Doe')).toBe(true);
      expect(userPaymentValidator.isValidCardholderName("Mary O'Brien")).toBe(true);
      expect(userPaymentValidator.isValidCardholderName('Jean-Pierre Martin')).toBe(true);
      expect(userPaymentValidator.isValidCardholderName('Dr. Smith Jr.')).toBe(true);
    });

    it('should reject names with numbers', () => {
      expect(userPaymentValidator.isValidCardholderName('John Doe 123')).toBe(false);
      expect(userPaymentValidator.isValidCardholderName('Test123')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(userPaymentValidator.isValidCardholderName('John@Doe')).toBe(false);
      expect(userPaymentValidator.isValidCardholderName('Test#User')).toBe(false);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(userPaymentValidator.isValidCardholderName('')).toBe(false);
      expect(userPaymentValidator.isValidCardholderName('   ')).toBe(false);
    });

    it('should reject names longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(userPaymentValidator.isValidCardholderName(longName)).toBe(false);
    });
  });

  describe('isValidIsDefault', () => {
    it('should accept boolean values', () => {
      expect(userPaymentValidator.isValidIsDefault(true)).toBe(true);
      expect(userPaymentValidator.isValidIsDefault(false)).toBe(true);
    });

    it('should reject non-boolean values', () => {
      expect(userPaymentValidator.isValidIsDefault('true')).toBe(false);
      expect(userPaymentValidator.isValidIsDefault(1)).toBe(false);
      expect(userPaymentValidator.isValidIsDefault(null)).toBe(false);
    });
  });

  describe('isExpiryDateValid', () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    it('should accept future dates', () => {
      expect(userPaymentValidator.isExpiryDateValid(12, currentYear + 1)).toBe(true);
      expect(userPaymentValidator.isExpiryDateValid(1, currentYear + 5)).toBe(true);
    });

    it('should accept current month and year', () => {
      expect(userPaymentValidator.isExpiryDateValid(currentMonth, currentYear)).toBe(true);
    });

    it('should accept future months in current year', () => {
      if (currentMonth < 12) {
        expect(userPaymentValidator.isExpiryDateValid(currentMonth + 1, currentYear)).toBe(true);
      }
    });

    it('should reject past dates', () => {
      if (currentMonth > 1) {
        expect(userPaymentValidator.isExpiryDateValid(currentMonth - 1, currentYear)).toBe(false);
      }
      expect(userPaymentValidator.isExpiryDateValid(12, currentYear - 1)).toBe(false);
    });

    it('should reject invalid month/year combinations', () => {
      expect(userPaymentValidator.isExpiryDateValid(13, currentYear)).toBe(false);
      expect(userPaymentValidator.isExpiryDateValid(0, currentYear)).toBe(false);
    });
  });

  describe('validatePaymentMethod', () => {
    const currentYear = new Date().getFullYear();

    it('should validate a complete valid credit card', () => {
      const validCard = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
        isDefault: true,
      };

      const result = userPaymentValidator.validatePaymentMethod(validCard);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate mastercard', () => {
      const mastercard = {
        cardType: 'mastercard',
        last4: '5678',
        expiryMonth: 6,
        expiryYear: currentYear + 2,
        cardholderName: 'Jane Smith',
      };

      const result = userPaymentValidator.validatePaymentMethod(mastercard);
      expect(result.valid).toBe(true);
    });

    it('should validate amex', () => {
      const amex = {
        cardType: 'amex',
        last4: '0005',
        expiryMonth: 3,
        expiryYear: currentYear + 1,
        cardholderName: 'Alice Johnson',
      };

      const result = userPaymentValidator.validatePaymentMethod(amex);
      expect(result.valid).toBe(true);
    });

    it('should validate discover', () => {
      const discover = {
        cardType: 'discover',
        last4: '1117',
        expiryMonth: 9,
        expiryYear: currentYear + 1,
        cardholderName: 'Bob Brown',
      };

      const result = userPaymentValidator.validatePaymentMethod(discover);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid cardType', () => {
      const invalid = {
        cardType: 'unknown',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Card type must be one of');
    });

    it('should reject missing cardType', () => {
      const invalid = {
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Card type must be one of');
    });

    it('should reject invalid last4 format', () => {
      const invalid = {
        cardType: 'visa',
        last4: '123',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Last 4 digits must be exactly 4 numeric characters');
    });

    it('should reject expired card', () => {
      const expired = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: 1,
        expiryYear: currentYear - 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(expired);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expiry year must be a valid year (current year or future)');
    });

    it('should reject invalid expiry month', () => {
      const invalid = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: 13,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Expiry month must be a number between 1 and 12');
    });

    it('should reject invalid cardholder name', () => {
      const invalid = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: '',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Cardholder name is required');
    });

    it('should reject invalid isDefault value', () => {
      const invalid = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
        isDefault: 'true',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('isDefault must be a boolean value');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalid = {
        cardType: 'invalid',
        last4: '123',
        expiryMonth: 13,
        expiryYear: 2020,
        cardholderName: '',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should extract last4 from cardNumber if provided', () => {
      const payment = {
        cardType: 'visa',
        cardNumber: '4111111111111111',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(payment);
      expect(result.valid).toBe(true);
      expect(result.normalizedPayment.last4).toBe('1111');
      // Ensure cardNumber is removed from normalized payment (should not be stored)
      expect(result.normalizedPayment.cardNumber).toBeUndefined();
    });

    it('should convert string month to number', () => {
      const payment = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: '6',
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(payment);
      expect(result.valid).toBe(true);
      expect(result.normalizedPayment.expiryMonth).toBe(6);
    });

    it('should convert string year to number', () => {
      const payment = {
        cardType: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: String(currentYear + 1),
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(payment);
      expect(result.valid).toBe(true);
      expect(result.normalizedPayment.expiryYear).toBe(currentYear + 1);
    });
  });
});
