import userPaymentValidator from '../src/validators/user.payment.validator.js';

describe('Payment Validator', () => {
  describe('isValidPaymentType', () => {
    it('should accept valid payment types', () => {
      expect(userPaymentValidator.isValidPaymentType('credit_card')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('debit_card')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('paypal')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('apple_pay')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('google_pay')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('bank_transfer')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('other')).toBe(true);
    });

    it('should accept case-insensitive types with whitespace', () => {
      expect(userPaymentValidator.isValidPaymentType(' CREDIT_CARD ')).toBe(true);
      expect(userPaymentValidator.isValidPaymentType('PayPal ')).toBe(true);
    });

    it('should reject invalid payment types', () => {
      expect(userPaymentValidator.isValidPaymentType('bitcoin')).toBe(false);
      expect(userPaymentValidator.isValidPaymentType('cash')).toBe(false);
      expect(userPaymentValidator.isValidPaymentType('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(userPaymentValidator.isValidPaymentType(null)).toBe(false);
      expect(userPaymentValidator.isValidPaymentType(undefined)).toBe(false);
      expect(userPaymentValidator.isValidPaymentType(123)).toBe(false);
    });
  });

  describe('isValidProvider', () => {
    it('should accept valid providers', () => {
      expect(userPaymentValidator.isValidProvider('visa')).toBe(true);
      expect(userPaymentValidator.isValidProvider('mastercard')).toBe(true);
      expect(userPaymentValidator.isValidProvider('amex')).toBe(true);
      expect(userPaymentValidator.isValidProvider('discover')).toBe(true);
      expect(userPaymentValidator.isValidProvider('paypal')).toBe(true);
      expect(userPaymentValidator.isValidProvider('stripe')).toBe(true);
      expect(userPaymentValidator.isValidProvider('square')).toBe(true);
      expect(userPaymentValidator.isValidProvider('other')).toBe(true);
    });

    it('should accept case-insensitive providers', () => {
      expect(userPaymentValidator.isValidProvider('VISA')).toBe(true);
      expect(userPaymentValidator.isValidProvider('MasterCard ')).toBe(true);
    });

    it('should reject invalid providers', () => {
      expect(userPaymentValidator.isValidProvider('jcb')).toBe(false);
      expect(userPaymentValidator.isValidProvider('unknown')).toBe(false);
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
      expect(userPaymentValidator.isValidCardholderName('Mary O\'Brien')).toBe(true);
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

  describe('isValidIsActive', () => {
    it('should accept boolean values', () => {
      expect(userPaymentValidator.isValidIsActive(true)).toBe(true);
      expect(userPaymentValidator.isValidIsActive(false)).toBe(true);
    });

    it('should reject non-boolean values', () => {
      expect(userPaymentValidator.isValidIsActive('false')).toBe(false);
      expect(userPaymentValidator.isValidIsActive(0)).toBe(false);
    });
  });

  describe('isValidNickname', () => {
    it('should accept valid nicknames', () => {
      expect(userPaymentValidator.isValidNickname('My Card')).toBe(true);
      expect(userPaymentValidator.isValidNickname('Personal')).toBe(true);
      expect(userPaymentValidator.isValidNickname('Work Card')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userPaymentValidator.isValidNickname(null)).toBe(true);
      expect(userPaymentValidator.isValidNickname(undefined)).toBe(true);
      expect(userPaymentValidator.isValidNickname('')).toBe(true);
    });

    it('should reject nicknames longer than 50 characters', () => {
      const longNickname = 'A'.repeat(51);
      expect(userPaymentValidator.isValidNickname(longNickname)).toBe(false);
    });

    it('should accept nicknames up to 50 characters', () => {
      const maxNickname = 'A'.repeat(50);
      expect(userPaymentValidator.isValidNickname(maxNickname)).toBe(true);
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

  describe('validatePaymentTypeAndProvider', () => {
    it('should accept valid credit card with visa', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('credit_card', 'visa');
      expect(errors).toEqual([]);
    });

    it('should reject PayPal with non-PayPal provider', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('paypal', 'visa');
      expect(errors).toContain('PayPal payment type must use PayPal as provider');
    });

    it('should accept PayPal with PayPal provider', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('paypal', 'paypal');
      expect(errors).toEqual([]);
    });

    it('should accept Apple Pay with card provider', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('apple_pay', 'visa');
      expect(errors).toEqual([]);
    });

    it('should reject Apple Pay with PayPal provider', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('apple_pay', 'paypal');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept Google Pay with card provider', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('google_pay', 'mastercard');
      expect(errors).toEqual([]);
    });

    it('should reject bank transfer without other provider', () => {
      const errors = userPaymentValidator.validatePaymentTypeAndProvider('bank_transfer', 'visa');
      expect(errors).toContain('Bank transfer should use "other" as provider');
    });
  });

  describe('validatePaymentMethod', () => {
    const currentYear = new Date().getFullYear();

    it('should validate a complete valid credit card', () => {
      const validCard = {
        type: 'credit_card',
        provider: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
        isDefault: true,
        isActive: true,
        nickname: 'My Visa',
      };

      const result = userPaymentValidator.validatePaymentMethod(validCard);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate debit card', () => {
      const debitCard = {
        type: 'debit_card',
        provider: 'mastercard',
        last4: '5678',
        expiryMonth: 6,
        expiryYear: currentYear + 2,
        cardholderName: 'Jane Smith',
      };

      const result = userPaymentValidator.validatePaymentMethod(debitCard);
      expect(result.valid).toBe(true);
    });

    it('should validate PayPal account', () => {
      const paypal = {
        type: 'paypal',
        provider: 'paypal',
        last4: '0000',
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(paypal);
      expect(result.valid).toBe(true);
    });

    it('should validate Apple Pay', () => {
      const applePay = {
        type: 'apple_pay',
        provider: 'visa',
        last4: '9999',
        expiryMonth: 3,
        expiryYear: currentYear + 1,
        cardholderName: 'Alice Johnson',
      };

      const result = userPaymentValidator.validatePaymentMethod(applePay);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid payment type', () => {
      const invalid = {
        type: 'bitcoin',
        provider: 'other',
        last4: '1234',
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Payment type must be one of');
    });

    it('should reject invalid provider', () => {
      const invalid = {
        type: 'credit_card',
        provider: 'unknown',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Provider must be one of');
    });

    it('should reject invalid last4 format', () => {
      const invalid = {
        type: 'credit_card',
        provider: 'visa',
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
        type: 'credit_card',
        provider: 'visa',
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
        type: 'credit_card',
        provider: 'visa',
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
        type: 'credit_card',
        provider: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: '',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Cardholder name is required');
    });

    it('should reject PayPal with wrong provider', () => {
      const invalid = {
        type: 'paypal',
        provider: 'visa',
        last4: '1234',
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('PayPal payment type must use PayPal as provider');
    });

    it('should reject invalid isDefault value', () => {
      const invalid = {
        type: 'credit_card',
        provider: 'visa',
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

    it('should reject invalid isActive value', () => {
      const invalid = {
        type: 'credit_card',
        provider: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
        isActive: 1,
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('isActive must be a boolean value');
    });

    it('should reject invalid nickname', () => {
      const longNickname = 'A'.repeat(51);
      const invalid = {
        type: 'credit_card',
        provider: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: currentYear + 1,
        cardholderName: 'John Doe',
        nickname: longNickname,
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Payment method nickname must be less than 50 characters');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalid = {
        type: 'invalid',
        provider: 'unknown',
        last4: '123',
        expiryMonth: 13,
        expiryYear: 2020,
        cardholderName: '',
      };

      const result = userPaymentValidator.validatePaymentMethod(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should not require expiry for PayPal', () => {
      const paypal = {
        type: 'paypal',
        provider: 'paypal',
        last4: '0000',
        cardholderName: 'John Doe',
        // No expiry fields
      };

      const result = userPaymentValidator.validatePaymentMethod(paypal);
      expect(result.valid).toBe(true);
    });

    it('should not require expiry for bank transfer', () => {
      const bankTransfer = {
        type: 'bank_transfer',
        provider: 'other',
        last4: '1234',
        cardholderName: 'John Doe',
      };

      const result = userPaymentValidator.validatePaymentMethod(bankTransfer);
      expect(result.valid).toBe(true);
    });
  });
});
