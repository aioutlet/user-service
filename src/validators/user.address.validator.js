// User address validation utility
const userAddressValidator = {
  isValidAddressType(type) {
    const validTypes = ['home', 'work', 'billing', 'shipping', 'other'];
    return typeof type === 'string' && validTypes.includes(type.trim().toLowerCase());
  },

  isValidAddressLine1(addressLine1) {
    return typeof addressLine1 === 'string' && addressLine1.trim().length > 0 && addressLine1.trim().length <= 200;
  },

  isValidAddressLine2(addressLine2) {
    // Optional field, but if provided must be valid
    if (!addressLine2) return true;
    return typeof addressLine2 === 'string' && addressLine2.trim().length <= 200;
  },

  isValidCity(city) {
    return (
      typeof city === 'string' &&
      city.trim().length > 0 &&
      city.trim().length <= 100 &&
      /^[a-zA-Z\s\-'\.]+$/.test(city.trim())
    );
  },

  isValidState(state) {
    return (
      typeof state === 'string' &&
      state.trim().length > 0 &&
      state.trim().length <= 100 &&
      /^[a-zA-Z\s\-'\.]+$/.test(state.trim())
    );
  },

  isValidZipCode(zipCode) {
    return (
      typeof zipCode === 'string' &&
      zipCode.trim().length > 0 &&
      zipCode.trim().length <= 20 &&
      /^[a-zA-Z0-9\s\-]+$/.test(zipCode.trim())
    );
  },

  isValidCountry(country) {
    return (
      typeof country === 'string' &&
      country.trim().length > 0 &&
      country.trim().length <= 100 &&
      /^[a-zA-Z\s\-'\.]+$/.test(country.trim())
    );
  },

  isValidPhone(phone) {
    // Optional field, but if provided must be valid
    if (!phone) return true;
    return typeof phone === 'string' && phone.trim().length <= 20 && /^[\+]?[0-9\s\-\(\)\.]+$/.test(phone.trim());
  },

  isValidIsDefault(isDefault) {
    return typeof isDefault === 'boolean';
  },

  validateAddress(address) {
    const errors = [];

    if (!this.isValidAddressType(address.type)) {
      errors.push('Address type must be one of: home, work, billing, shipping, other');
    }

    if (!this.isValidAddressLine1(address.addressLine1)) {
      errors.push('Address line 1 is required and must be less than 200 characters');
    }

    if (!this.isValidAddressLine2(address.addressLine2)) {
      errors.push('Address line 2 must be less than 200 characters');
    }

    if (!this.isValidCity(address.city)) {
      errors.push('City is required and must contain only letters, spaces, hyphens, apostrophes, and periods');
    }

    if (!this.isValidState(address.state)) {
      errors.push('State is required and must contain only letters, spaces, hyphens, apostrophes, and periods');
    }

    if (!this.isValidZipCode(address.zipCode)) {
      errors.push('Zip code is required and must contain only alphanumeric characters, spaces, and hyphens');
    }

    if (!this.isValidCountry(address.country)) {
      errors.push('Country is required and must contain only letters, spaces, hyphens, apostrophes, and periods');
    }

    if (!this.isValidPhone(address.phone)) {
      errors.push('Phone number must contain only numbers, spaces, hyphens, parentheses, periods, and plus sign');
    }

    if (address.isDefault !== undefined && !this.isValidIsDefault(address.isDefault)) {
      errors.push('isDefault must be a boolean value');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },
};

export default userAddressValidator;
