// User wishlist validation utility
const userWishlistValidator = {
  isValidProductId(productId) {
    return typeof productId === 'string' && productId.trim().length > 0 && productId.trim().length <= 100;
  },

  isValidProductName(productName) {
    return typeof productName === 'string' && productName.trim().length > 0 && productName.trim().length <= 200;
  },

  isValidProductPrice(productPrice) {
    return (
      typeof productPrice === 'number' && !isNaN(productPrice) && productPrice >= 0 && productPrice <= 999999.99 // Reasonable max price
    );
  },

  isValidProductImage(productImage) {
    // Optional field, but if provided must be valid
    if (!productImage) {return true;}
    return (
      typeof productImage === 'string' &&
      productImage.trim().length > 0 &&
      productImage.trim().length <= 500 &&
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(productImage.trim())
    );
  },

  isValidProductCategory(productCategory) {
    // Optional field, but if provided must be valid
    if (!productCategory) {return true;}
    return (
      typeof productCategory === 'string' &&
      productCategory.trim().length > 0 &&
      productCategory.trim().length <= 100 &&
      /^[a-zA-Z0-9\s\-&]+$/.test(productCategory.trim())
    );
  },

  isValidProductBrand(productBrand) {
    // Optional field, but if provided must be valid
    if (!productBrand) {return true;}
    return (
      typeof productBrand === 'string' &&
      productBrand.trim().length > 0 &&
      productBrand.trim().length <= 100 &&
      /^[a-zA-Z0-9\s\-&\.]+$/.test(productBrand.trim())
    );
  },

  isValidNotes(notes) {
    // Optional field, but if provided must be valid
    if (!notes) {return true;}
    return typeof notes === 'string' && notes.trim().length <= 500;
  },

  validateWishlistItem(wishlistItem) {
    const errors = [];

    if (!this.isValidProductId(wishlistItem.productId)) {
      errors.push('Product ID is required and must be a non-empty string (max 100 characters)');
    }

    if (!this.isValidProductName(wishlistItem.productName)) {
      errors.push('Product name is required and must be between 1 and 200 characters');
    }

    if (!this.isValidProductPrice(wishlistItem.productPrice)) {
      errors.push('Product price is required and must be a non-negative number');
    }

    if (!this.isValidProductImage(wishlistItem.productImage)) {
      errors.push('Product image must be a valid HTTP/HTTPS URL ending with jpg, jpeg, png, gif, or webp');
    }

    if (!this.isValidProductCategory(wishlistItem.productCategory)) {
      errors.push(
        'Product category must contain only letters, numbers, spaces, hyphens, and ampersands (max 100 characters)',
      );
    }

    if (!this.isValidProductBrand(wishlistItem.productBrand)) {
      errors.push(
        'Product brand must contain only letters, numbers, spaces, hyphens, ampersands, and periods (max 100 characters)',
      );
    }

    if (!this.isValidNotes(wishlistItem.notes)) {
      errors.push('Notes must be less than 500 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  validateWishlistArray(wishlist) {
    if (!Array.isArray(wishlist)) {
      return {
        valid: false,
        errors: ['Wishlist must be an array'],
      };
    }

    // Check for duplicate product IDs
    const productIds = wishlist.map((item) => item.productId).filter(Boolean);
    const duplicateIds = productIds.filter((id, index) => productIds.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
      return {
        valid: false,
        errors: [`Duplicate product IDs found: ${[...new Set(duplicateIds)].join(', ')}`],
      };
    }

    // Validate each item
    const allErrors = [];
    wishlist.forEach((item, index) => {
      const validation = this.validateWishlistItem(item);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          allErrors.push(`Item ${index + 1}: ${error}`);
        });
      }
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  },
};

export default userWishlistValidator;
