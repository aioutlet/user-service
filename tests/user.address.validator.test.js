import userAddressValidator from '../src/validators/user.address.validator.js';

describe('Address Validator', () => {
  describe('isValidAddressType', () => {
    it('should accept valid address types', () => {
      expect(userAddressValidator.isValidAddressType('home')).toBe(true);
      expect(userAddressValidator.isValidAddressType('work')).toBe(true);
      expect(userAddressValidator.isValidAddressType('billing')).toBe(true);
      expect(userAddressValidator.isValidAddressType('shipping')).toBe(true);
      expect(userAddressValidator.isValidAddressType('other')).toBe(true);
    });

    it('should accept case-insensitive types with whitespace', () => {
      expect(userAddressValidator.isValidAddressType(' HOME ')).toBe(true);
      expect(userAddressValidator.isValidAddressType('Work ')).toBe(true);
      expect(userAddressValidator.isValidAddressType(' Billing')).toBe(true);
    });

    it('should reject invalid address types', () => {
      expect(userAddressValidator.isValidAddressType('invalid')).toBe(false);
      expect(userAddressValidator.isValidAddressType('residence')).toBe(false);
      expect(userAddressValidator.isValidAddressType('')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(userAddressValidator.isValidAddressType(null)).toBe(false);
      expect(userAddressValidator.isValidAddressType(undefined)).toBe(false);
      expect(userAddressValidator.isValidAddressType(123)).toBe(false);
      expect(userAddressValidator.isValidAddressType({})).toBe(false);
    });
  });

  describe('isValidAddressLine1', () => {
    it('should accept valid address line 1', () => {
      expect(userAddressValidator.isValidAddressLine1('123 Main St')).toBe(true);
      expect(userAddressValidator.isValidAddressLine1('Apt 4B')).toBe(true);
      expect(userAddressValidator.isValidAddressLine1('PO Box 789')).toBe(true);
    });

    it('should accept address with special characters', () => {
      expect(userAddressValidator.isValidAddressLine1('123 Main St, Apt #4')).toBe(true);
      expect(userAddressValidator.isValidAddressLine1('456 Oak Ave. Suite 200')).toBe(true);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(userAddressValidator.isValidAddressLine1('')).toBe(false);
      expect(userAddressValidator.isValidAddressLine1('   ')).toBe(false);
    });

    it('should reject address longer than 200 characters', () => {
      const longAddress = 'A'.repeat(201);
      expect(userAddressValidator.isValidAddressLine1(longAddress)).toBe(false);
    });

    it('should accept address up to 200 characters', () => {
      const maxAddress = 'A'.repeat(200);
      expect(userAddressValidator.isValidAddressLine1(maxAddress)).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(userAddressValidator.isValidAddressLine1(null)).toBe(false);
      expect(userAddressValidator.isValidAddressLine1(undefined)).toBe(false);
      expect(userAddressValidator.isValidAddressLine1(123)).toBe(false);
    });
  });

  describe('isValidAddressLine2', () => {
    it('should accept valid address line 2', () => {
      expect(userAddressValidator.isValidAddressLine2('Apt 4B')).toBe(true);
      expect(userAddressValidator.isValidAddressLine2('Suite 200')).toBe(true);
      expect(userAddressValidator.isValidAddressLine2('Floor 3')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userAddressValidator.isValidAddressLine2(null)).toBe(true);
      expect(userAddressValidator.isValidAddressLine2(undefined)).toBe(true);
      expect(userAddressValidator.isValidAddressLine2('')).toBe(true);
    });

    it('should reject address longer than 200 characters', () => {
      const longAddress = 'B'.repeat(201);
      expect(userAddressValidator.isValidAddressLine2(longAddress)).toBe(false);
    });

    it('should accept address up to 200 characters', () => {
      const maxAddress = 'B'.repeat(200);
      expect(userAddressValidator.isValidAddressLine2(maxAddress)).toBe(true);
    });
  });

  describe('isValidCity', () => {
    it('should accept valid city names', () => {
      expect(userAddressValidator.isValidCity('New York')).toBe(true);
      expect(userAddressValidator.isValidCity('San Francisco')).toBe(true);
      expect(userAddressValidator.isValidCity('St. Paul\'s')).toBe(true);
      expect(userAddressValidator.isValidCity('Los Angeles-Beach')).toBe(true);
    });

    it('should reject city with numbers', () => {
      expect(userAddressValidator.isValidCity('New York 123')).toBe(false);
      expect(userAddressValidator.isValidCity('City1')).toBe(false);
    });

    it('should reject city with special characters', () => {
      expect(userAddressValidator.isValidCity('City@Name')).toBe(false);
      expect(userAddressValidator.isValidCity('City#123')).toBe(false);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(userAddressValidator.isValidCity('')).toBe(false);
      expect(userAddressValidator.isValidCity('   ')).toBe(false);
    });

    it('should reject city longer than 100 characters', () => {
      const longCity = 'A'.repeat(101);
      expect(userAddressValidator.isValidCity(longCity)).toBe(false);
    });

    it('should accept city up to 100 characters', () => {
      const maxCity = 'A'.repeat(100);
      expect(userAddressValidator.isValidCity(maxCity)).toBe(true);
    });
  });

  describe('isValidState', () => {
    it('should accept valid state names', () => {
      expect(userAddressValidator.isValidState('California')).toBe(true);
      expect(userAddressValidator.isValidState('New York')).toBe(true);
      expect(userAddressValidator.isValidState('CA')).toBe(true);
      expect(userAddressValidator.isValidState('NY')).toBe(true);
    });

    it('should accept state with hyphens and apostrophes', () => {
      expect(userAddressValidator.isValidState('O\'Brien')).toBe(true);
      expect(userAddressValidator.isValidState('North-South')).toBe(true);
      expect(userAddressValidator.isValidState('St. Louis')).toBe(true);
    });

    it('should reject state with numbers', () => {
      expect(userAddressValidator.isValidState('State123')).toBe(false);
      expect(userAddressValidator.isValidState('CA 123')).toBe(false);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(userAddressValidator.isValidState('')).toBe(false);
      expect(userAddressValidator.isValidState('   ')).toBe(false);
    });

    it('should reject state longer than 100 characters', () => {
      const longState = 'A'.repeat(101);
      expect(userAddressValidator.isValidState(longState)).toBe(false);
    });
  });

  describe('isValidZipCode', () => {
    it('should accept valid US zip codes', () => {
      expect(userAddressValidator.isValidZipCode('12345')).toBe(true);
      expect(userAddressValidator.isValidZipCode('12345-6789')).toBe(true);
    });

    it('should accept international postal codes', () => {
      expect(userAddressValidator.isValidZipCode('SW1A 1AA')).toBe(true); // UK
      expect(userAddressValidator.isValidZipCode('K1A 0B1')).toBe(true); // Canada
      expect(userAddressValidator.isValidZipCode('75001')).toBe(true); // France
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(userAddressValidator.isValidZipCode('')).toBe(false);
      expect(userAddressValidator.isValidZipCode('   ')).toBe(false);
    });

    it('should reject zip code with invalid characters', () => {
      expect(userAddressValidator.isValidZipCode('123@45')).toBe(false);
      expect(userAddressValidator.isValidZipCode('ABC#DEF')).toBe(false);
    });

    it('should reject zip code longer than 20 characters', () => {
      const longZip = '1'.repeat(21);
      expect(userAddressValidator.isValidZipCode(longZip)).toBe(false);
    });

    it('should accept zip code up to 20 characters', () => {
      const maxZip = '1'.repeat(20);
      expect(userAddressValidator.isValidZipCode(maxZip)).toBe(true);
    });
  });

  describe('isValidCountry', () => {
    it('should accept valid country names', () => {
      expect(userAddressValidator.isValidCountry('United States')).toBe(true);
      expect(userAddressValidator.isValidCountry('USA')).toBe(true);
      expect(userAddressValidator.isValidCountry('United Kingdom')).toBe(true);
      expect(userAddressValidator.isValidCountry('Canada')).toBe(true);
    });

    it('should accept country with hyphens and apostrophes', () => {
      expect(userAddressValidator.isValidCountry('Cote d\'Ivoire')).toBe(true);
      expect(userAddressValidator.isValidCountry('Guinea-Bissau')).toBe(true);
    });

    it('should reject country with numbers', () => {
      expect(userAddressValidator.isValidCountry('Country123')).toBe(false);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(userAddressValidator.isValidCountry('')).toBe(false);
      expect(userAddressValidator.isValidCountry('   ')).toBe(false);
    });

    it('should reject country longer than 100 characters', () => {
      const longCountry = 'A'.repeat(101);
      expect(userAddressValidator.isValidCountry(longCountry)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should accept valid phone numbers', () => {
      expect(userAddressValidator.isValidPhone('+1-555-123-4567')).toBe(true);
      expect(userAddressValidator.isValidPhone('(555) 123-4567')).toBe(true);
      expect(userAddressValidator.isValidPhone('555.123.4567')).toBe(true);
      expect(userAddressValidator.isValidPhone('+44 20 1234 5678')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userAddressValidator.isValidPhone(null)).toBe(true);
      expect(userAddressValidator.isValidPhone(undefined)).toBe(true);
      expect(userAddressValidator.isValidPhone('')).toBe(true);
    });

    it('should reject phone with invalid characters', () => {
      expect(userAddressValidator.isValidPhone('555-123-ABCD')).toBe(false);
      expect(userAddressValidator.isValidPhone('phone@123')).toBe(false);
    });

    it('should reject phone longer than 20 characters', () => {
      const longPhone = '1'.repeat(21);
      expect(userAddressValidator.isValidPhone(longPhone)).toBe(false);
    });

    it('should accept phone up to 20 characters', () => {
      const maxPhone = '1'.repeat(20);
      expect(userAddressValidator.isValidPhone(maxPhone)).toBe(true);
    });
  });

  describe('isValidIsDefault', () => {
    it('should accept boolean values', () => {
      expect(userAddressValidator.isValidIsDefault(true)).toBe(true);
      expect(userAddressValidator.isValidIsDefault(false)).toBe(true);
    });

    it('should reject non-boolean values', () => {
      expect(userAddressValidator.isValidIsDefault('true')).toBe(false);
      expect(userAddressValidator.isValidIsDefault(1)).toBe(false);
      expect(userAddressValidator.isValidIsDefault(0)).toBe(false);
      expect(userAddressValidator.isValidIsDefault(null)).toBe(false);
      expect(userAddressValidator.isValidIsDefault(undefined)).toBe(false);
    });
  });

  describe('validateAddress', () => {
    it('should validate a complete valid address', () => {
      const validAddress = {
        type: 'home',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: '+1-555-123-4567',
        isDefault: true,
      };

      const result = userAddressValidator.validateAddress(validAddress);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate address without optional fields', () => {
      const minimalAddress = {
        type: 'work',
        addressLine1: '456 Oak Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
      };

      const result = userAddressValidator.validateAddress(minimalAddress);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject address with invalid type', () => {
      const address = {
        type: 'invalid',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Address type must be one of: home, work, billing, shipping, other');
    });

    it('should reject address with missing addressLine1', () => {
      const address = {
        type: 'home',
        addressLine1: '',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Address line 1 is required and must be less than 200 characters');
    });

    it('should reject address with invalid city (contains numbers)', () => {
      const address = {
        type: 'home',
        addressLine1: '123 Main St',
        city: 'New York 123',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'City is required and must contain only letters, spaces, hyphens, apostrophes, and periods',
      );
    });

    it('should reject address with invalid state', () => {
      const address = {
        type: 'home',
        addressLine1: '123 Main St',
        city: 'New York',
        state: '',
        zipCode: '10001',
        country: 'USA',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'State is required and must contain only letters, spaces, hyphens, apostrophes, and periods',
      );
    });

    it('should reject address with invalid zipCode', () => {
      const address = {
        type: 'home',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '',
        country: 'USA',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Zip code is required and must contain only alphanumeric characters, spaces, and hyphens',
      );
    });

    it('should reject address with invalid country', () => {
      const address = {
        type: 'home',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: '',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Country is required and must contain only letters, spaces, hyphens, apostrophes, and periods',
      );
    });

    it('should reject address with invalid phone format', () => {
      const address = {
        type: 'home',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: 'invalid-phone@123',
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Phone number must contain only numbers, spaces, hyphens, parentheses, periods, and plus sign',
      );
    });

    it('should reject address with invalid isDefault value', () => {
      const address = {
        type: 'home',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        isDefault: 'true', // String instead of boolean
      };

      const result = userAddressValidator.validateAddress(address);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('isDefault must be a boolean value');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidAddress = {
        type: 'invalid',
        addressLine1: '',
        city: 'New York 123',
        state: '',
        zipCode: '',
        country: '',
      };

      const result = userAddressValidator.validateAddress(invalidAddress);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      expect(result.errors).toContain('Address type must be one of: home, work, billing, shipping, other');
      expect(result.errors).toContain('Address line 1 is required and must be less than 200 characters');
    });

    it('should validate all address types', () => {
      const types = ['home', 'work', 'billing', 'shipping', 'other'];

      types.forEach((type) => {
        const address = {
          type,
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        };

        const result = userAddressValidator.validateAddress(address);
        expect(result.valid).toBe(true);
      });
    });
  });
});
