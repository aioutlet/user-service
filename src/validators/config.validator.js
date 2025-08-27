/**
 * Configuration Validator
 * Validates application configuration for completeness and production readiness
 */

/**
 * Validate application configuration
 * @param {Object} config - The configuration object to validate
 * @throws {Error} If configuration validation fails
 */
export const validateConfig = (config) => {
  const errors = [];

  // === Database Configuration Validation ===
  if (!config.database.uri) {
    errors.push('Database configuration is incomplete');
  } else {
    try {
      // Basic URI validation
      new URL(config.database.uri.replace('mongodb://', 'http://').replace('mongodb+srv://', 'http://'));
    } catch {
      errors.push('Database URI format is invalid');
    }
  }

  // === JWT Configuration Validation ===
  if (!config.jwt.secret || config.jwt.secret.includes('CHANGE_THIS')) {
    errors.push('JWT_SECRET must be set and not contain default values');
  }

  if (config.jwt.secret && config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }

  // Check for common weak secrets
  if (config.jwt.secret) {
    const weakSecrets = ['secret', 'password', '123456', 'jwt_secret', 'change_me'];
    if (weakSecrets.some((weak) => config.jwt.secret.toLowerCase().includes(weak))) {
      errors.push('JWT_SECRET appears to be weak - use a strong, random secret');
    }
  }

  // === Security Configuration Validation ===
  // Validate CORS origins
  if (config.security.corsOrigin && Array.isArray(config.security.corsOrigin)) {
    const invalidOrigins = config.security.corsOrigin.filter((origin) => {
      try {
        new URL(origin);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidOrigins.length > 0) {
      errors.push(`Invalid CORS origins: ${invalidOrigins.join(', ')}`);
    }
  }

  // Validate bcrypt rounds
  if (config.security.bcryptRounds < 4 || config.security.bcryptRounds > 20) {
    errors.push('BCRYPT_ROUNDS must be between 4 and 20');
  }

  // === Production-specific validations ===
  if (config.isProduction) {
    if (config.logging.level === 'debug') {
      errors.push('LOG_LEVEL should not be debug in production');
    }

    if (!config.security.enableSecurityHeaders) {
      errors.push('Security headers should be enabled in production');
    }

    // Production environment should have proper CORS origins
    if (!config.security.corsOrigin || config.security.corsOrigin.includes('localhost')) {
      errors.push('CORS_ORIGIN should not include localhost in production');
    }

    // Production should have proper bcrypt rounds
    if (config.security.bcryptRounds < 12) {
      errors.push('BCRYPT_ROUNDS should be at least 12 in production');
    }
  }

  // === Development-specific validations ===
  if (config.isDevelopment) {
    // Warn about weak settings in development
    if (config.security.bcryptRounds > 12) {
      console.warn('⚠️  BCRYPT_ROUNDS is high for development - this may slow down tests and development');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map((err) => `  - ${err}`).join('\n')}`);
  }

  console.log('✅ Configuration validation passed');
};

export default {
  validateConfig,
};
