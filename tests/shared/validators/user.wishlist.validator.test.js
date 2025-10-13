import userWishlistValidator from '../../../src/shared/validators/user.wishlist.validator.js';

describe('Wishlist Validator', () => {
  describe('isValidProductId', () => {
    it('should accept valid product IDs', () => {
      expect(userWishlistValidator.isValidProductId('abc123')).toBe(true);
      expect(userWishlistValidator.isValidProductId('product-1')).toBe(true);
      expect(userWishlistValidator.isValidProductId('SKU_12345')).toBe(true);
    });

    it('should reject empty or whitespace-only IDs', () => {
      expect(userWishlistValidator.isValidProductId('')).toBe(false);
      expect(userWishlistValidator.isValidProductId('   ')).toBe(false);
    });

    it('should reject IDs longer than 100 characters', () => {
      const longId = 'A'.repeat(101);
      expect(userWishlistValidator.isValidProductId(longId)).toBe(false);
    });

    it('should accept IDs up to 100 characters', () => {
      const maxId = 'A'.repeat(100);
      expect(userWishlistValidator.isValidProductId(maxId)).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(userWishlistValidator.isValidProductId(null)).toBe(false);
      expect(userWishlistValidator.isValidProductId(undefined)).toBe(false);
      expect(userWishlistValidator.isValidProductId(123)).toBe(false);
    });
  });

  describe('isValidProductName', () => {
    it('should accept valid product names', () => {
      expect(userWishlistValidator.isValidProductName('Laptop')).toBe(true);
      expect(userWishlistValidator.isValidProductName('Gaming Mouse RGB')).toBe(true);
      expect(userWishlistValidator.isValidProductName('4K Monitor - 27 inch')).toBe(true);
    });

    it('should reject empty or whitespace-only names', () => {
      expect(userWishlistValidator.isValidProductName('')).toBe(false);
      expect(userWishlistValidator.isValidProductName('   ')).toBe(false);
    });

    it('should reject names longer than 200 characters', () => {
      const longName = 'A'.repeat(201);
      expect(userWishlistValidator.isValidProductName(longName)).toBe(false);
    });

    it('should accept names up to 200 characters', () => {
      const maxName = 'A'.repeat(200);
      expect(userWishlistValidator.isValidProductName(maxName)).toBe(true);
    });

    it('should reject non-string values', () => {
      expect(userWishlistValidator.isValidProductName(null)).toBe(false);
      expect(userWishlistValidator.isValidProductName(123)).toBe(false);
    });
  });

  describe('isValidProductPrice', () => {
    it('should accept valid prices', () => {
      expect(userWishlistValidator.isValidProductPrice(0)).toBe(true);
      expect(userWishlistValidator.isValidProductPrice(10.99)).toBe(true);
      expect(userWishlistValidator.isValidProductPrice(1000)).toBe(true);
      expect(userWishlistValidator.isValidProductPrice(999999.99)).toBe(true);
    });

    it('should reject negative prices', () => {
      expect(userWishlistValidator.isValidProductPrice(-1)).toBe(false);
      expect(userWishlistValidator.isValidProductPrice(-0.01)).toBe(false);
    });

    it('should reject prices above maximum', () => {
      expect(userWishlistValidator.isValidProductPrice(1000000)).toBe(false);
      expect(userWishlistValidator.isValidProductPrice(9999999)).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(userWishlistValidator.isValidProductPrice('10.99')).toBe(false);
      expect(userWishlistValidator.isValidProductPrice(null)).toBe(false);
      expect(userWishlistValidator.isValidProductPrice(undefined)).toBe(false);
      expect(userWishlistValidator.isValidProductPrice(NaN)).toBe(false);
    });
  });

  describe('isValidProductImage', () => {
    it('should accept valid image URLs', () => {
      expect(userWishlistValidator.isValidProductImage('https://example.com/image.jpg')).toBe(true);
      expect(userWishlistValidator.isValidProductImage('http://cdn.example.com/photo.jpeg')).toBe(true);
      expect(userWishlistValidator.isValidProductImage('https://images.example.com/product.png')).toBe(true);
      expect(userWishlistValidator.isValidProductImage('https://example.com/animated.gif')).toBe(true);
      expect(userWishlistValidator.isValidProductImage('https://example.com/image.webp')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userWishlistValidator.isValidProductImage(null)).toBe(true);
      expect(userWishlistValidator.isValidProductImage(undefined)).toBe(true);
      expect(userWishlistValidator.isValidProductImage('')).toBe(true);
    });

    it('should reject URLs without valid image extensions', () => {
      expect(userWishlistValidator.isValidProductImage('https://example.com/image.bmp')).toBe(false);
      expect(userWishlistValidator.isValidProductImage('https://example.com/document.pdf')).toBe(false);
      expect(userWishlistValidator.isValidProductImage('https://example.com/image')).toBe(false);
    });

    it('should reject invalid URL formats', () => {
      expect(userWishlistValidator.isValidProductImage('not-a-url')).toBe(false);
      expect(userWishlistValidator.isValidProductImage('ftp://example.com/image.jpg')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(userWishlistValidator.isValidProductImage(123)).toBe(false);
    });
  });

  describe('isValidProductCategory', () => {
    it('should accept valid categories', () => {
      expect(userWishlistValidator.isValidProductCategory('Electronics')).toBe(true);
      expect(userWishlistValidator.isValidProductCategory('Home & Garden')).toBe(true);
      expect(userWishlistValidator.isValidProductCategory('Sports-Outdoors')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userWishlistValidator.isValidProductCategory(null)).toBe(true);
      expect(userWishlistValidator.isValidProductCategory(undefined)).toBe(true);
      expect(userWishlistValidator.isValidProductCategory('')).toBe(true);
    });

    it('should reject categories with invalid characters', () => {
      expect(userWishlistValidator.isValidProductCategory('Invalid@Category')).toBe(false);
      expect(userWishlistValidator.isValidProductCategory('Test#123')).toBe(false);
    });

    it('should reject categories longer than 100 characters', () => {
      const longCategory = 'A'.repeat(101);
      expect(userWishlistValidator.isValidProductCategory(longCategory)).toBe(false);
    });
  });

  describe('isValidProductBrand', () => {
    it('should accept valid brands', () => {
      expect(userWishlistValidator.isValidProductBrand('Apple')).toBe(true);
      expect(userWishlistValidator.isValidProductBrand('Sony Electronics')).toBe(true);
      expect(userWishlistValidator.isValidProductBrand('L.L. Bean')).toBe(true);
      expect(userWishlistValidator.isValidProductBrand('3M Company')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userWishlistValidator.isValidProductBrand(null)).toBe(true);
      expect(userWishlistValidator.isValidProductBrand(undefined)).toBe(true);
      expect(userWishlistValidator.isValidProductBrand('')).toBe(true);
    });

    it('should reject brands with invalid characters', () => {
      expect(userWishlistValidator.isValidProductBrand('Invalid@Brand')).toBe(false);
      expect(userWishlistValidator.isValidProductBrand('Test#Brand')).toBe(false);
    });

    it('should reject brands longer than 100 characters', () => {
      const longBrand = 'A'.repeat(101);
      expect(userWishlistValidator.isValidProductBrand(longBrand)).toBe(false);
    });
  });

  describe('isValidNotes', () => {
    it('should accept valid notes', () => {
      expect(userWishlistValidator.isValidNotes('Want this for birthday')).toBe(true);
      expect(userWishlistValidator.isValidNotes('Check reviews before buying')).toBe(true);
      expect(userWishlistValidator.isValidNotes('Need to compare prices')).toBe(true);
    });

    it('should accept null or undefined (optional field)', () => {
      expect(userWishlistValidator.isValidNotes(null)).toBe(true);
      expect(userWishlistValidator.isValidNotes(undefined)).toBe(true);
      expect(userWishlistValidator.isValidNotes('')).toBe(true);
    });

    it('should reject notes longer than 500 characters', () => {
      const longNotes = 'A'.repeat(501);
      expect(userWishlistValidator.isValidNotes(longNotes)).toBe(false);
    });

    it('should accept notes up to 500 characters', () => {
      const maxNotes = 'A'.repeat(500);
      expect(userWishlistValidator.isValidNotes(maxNotes)).toBe(true);
    });
  });

  describe('validateWishlistItem', () => {
    it('should validate a complete valid wishlist item', () => {
      const validItem = {
        productId: 'prod123',
        productName: 'Gaming Laptop',
        productPrice: 1299.99,
        productImage: 'https://example.com/laptop.jpg',
        productCategory: 'Electronics',
        productBrand: 'Dell',
        notes: 'Wait for Black Friday sale',
      };

      const result = userWishlistValidator.validateWishlistItem(validItem);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate item with only required fields', () => {
      const minimalItem = {
        productId: 'prod456',
        productName: 'Wireless Mouse',
        productPrice: 29.99,
      };

      const result = userWishlistValidator.validateWishlistItem(minimalItem);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject item with missing productId', () => {
      const invalid = {
        productName: 'Mouse',
        productPrice: 29.99,
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product ID is required and must be a non-empty string (max 100 characters)');
    });

    it('should reject item with missing productName', () => {
      const invalid = {
        productId: 'prod123',
        productPrice: 29.99,
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product name is required and must be between 1 and 200 characters');
    });

    it('should reject item with missing productPrice', () => {
      const invalid = {
        productId: 'prod123',
        productName: 'Mouse',
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product price is required and must be a non-negative number');
    });

    it('should reject item with invalid productId', () => {
      const invalid = {
        productId: '',
        productName: 'Mouse',
        productPrice: 29.99,
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product ID is required and must be a non-empty string (max 100 characters)');
    });

    it('should reject item with invalid productPrice', () => {
      const invalid = {
        productId: 'prod123',
        productName: 'Mouse',
        productPrice: -10,
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product price is required and must be a non-negative number');
    });

    it('should reject item with invalid productImage URL', () => {
      const invalid = {
        productId: 'prod123',
        productName: 'Mouse',
        productPrice: 29.99,
        productImage: 'not-a-valid-url',
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Product image must be a valid HTTP/HTTPS URL');
    });

    it('should reject item with invalid productCategory', () => {
      const invalid = {
        productId: 'prod123',
        productName: 'Mouse',
        productPrice: 29.99,
        productCategory: 'Invalid@Category',
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain(
        'Product category must contain only letters, numbers, spaces, hyphens, and ampersands'
      );
    });

    it('should reject item with invalid notes', () => {
      const invalid = {
        productId: 'prod123',
        productName: 'Mouse',
        productPrice: 29.99,
        notes: 'A'.repeat(501),
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Notes must be less than 500 characters');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalid = {
        productId: '',
        productName: '',
        productPrice: -10,
        productImage: 'invalid-url',
      };

      const result = userWishlistValidator.validateWishlistItem(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateWishlistArray', () => {
    it('should validate an array of valid items', () => {
      const validArray = [
        {
          productId: 'prod1',
          productName: 'Laptop',
          productPrice: 1299.99,
        },
        {
          productId: 'prod2',
          productName: 'Mouse',
          productPrice: 29.99,
        },
      ];

      const result = userWishlistValidator.validateWishlistArray(validArray);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept an empty array', () => {
      const result = userWishlistValidator.validateWishlistArray([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject non-array values', () => {
      const result = userWishlistValidator.validateWishlistArray('not-an-array');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wishlist must be an array');
    });

    it('should reject null or undefined', () => {
      let result = userWishlistValidator.validateWishlistArray(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wishlist must be an array');

      result = userWishlistValidator.validateWishlistArray(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Wishlist must be an array');
    });

    it('should detect duplicate product IDs', () => {
      const duplicateArray = [
        {
          productId: 'prod1',
          productName: 'Laptop',
          productPrice: 1299.99,
        },
        {
          productId: 'prod1',
          productName: 'Different Laptop',
          productPrice: 999.99,
        },
      ];

      const result = userWishlistValidator.validateWishlistArray(duplicateArray);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate product IDs found: prod1');
    });

    it('should report errors for invalid items with index', () => {
      const invalidArray = [
        {
          productId: 'prod1',
          productName: 'Valid Item',
          productPrice: 29.99,
        },
        {
          productId: '',
          productName: 'Invalid Item',
          productPrice: -10,
        },
      ];

      const result = userWishlistValidator.validateWishlistArray(invalidArray);
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.includes('Item 2:'))).toBe(true);
    });

    it('should report multiple errors across multiple items', () => {
      const invalidArray = [
        {
          productId: '',
          productName: 'Item 1',
          productPrice: 10,
        },
        {
          productId: 'prod2',
          productName: '',
          productPrice: 20,
        },
        {
          productId: 'prod3',
          productName: 'Item 3',
          productPrice: -5,
        },
      ];

      const result = userWishlistValidator.validateWishlistArray(invalidArray);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should validate items with optional fields', () => {
      const validArray = [
        {
          productId: 'prod1',
          productName: 'Laptop',
          productPrice: 1299.99,
          productImage: 'https://example.com/laptop.jpg',
          productCategory: 'Electronics',
          productBrand: 'Dell',
          notes: 'Wait for sale',
        },
        {
          productId: 'prod2',
          productName: 'Mouse',
          productPrice: 29.99,
          // No optional fields
        },
      ];

      const result = userWishlistValidator.validateWishlistArray(validArray);
      expect(result.valid).toBe(true);
    });
  });
});
