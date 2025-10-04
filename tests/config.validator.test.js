import { validateConfig } from '../src/validators/config.validator.js';

describe('Config Validator', () => {
  // Helper to create a valid base config
  const createValidConfig = (overrides = {}) => ({
    database: {
      uri: 'mongodb://admin:password@localhost:27018/user_service_db?authSource=admin',
    },
    jwt: {
      secret:
        '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',
    },
    security: {
      corsOrigin: ['https://example.com', 'https://api.example.com'],
      bcryptRounds: 12,
      enableSecurityHeaders: true,
    },
    logging: {
      level: 'info',
    },
    isProduction: false,
    isDevelopment: true,
    ...overrides,
  });

  describe('Valid Configurations', () => {
    it('should pass with valid development configuration', () => {
      const config = createValidConfig();
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass with valid production configuration', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'info' },
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass with MongoDB SRV connection string', () => {
      const config = createValidConfig({
        database: {
          uri: 'mongodb+srv://user:pass@cluster.mongodb.net/database?retryWrites=true',
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass with single CORS origin', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass with bcrypt rounds at minimum (4)', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 4,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass with bcrypt rounds at maximum (20)', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 20,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('Database Configuration', () => {
    it('should fail when database URI is missing', () => {
      const config = createValidConfig({
        database: { uri: '' },
      });
      expect(() => validateConfig(config)).toThrow('Database configuration is incomplete');
    });

    it('should fail when database URI is null', () => {
      const config = createValidConfig({
        database: { uri: null },
      });
      expect(() => validateConfig(config)).toThrow('Database configuration is incomplete');
    });

    it('should fail when database URI is undefined', () => {
      const config = createValidConfig({
        database: { uri: undefined },
      });
      expect(() => validateConfig(config)).toThrow('Database configuration is incomplete');
    });

    it('should fail when database URI format is invalid', () => {
      const config = createValidConfig({
        database: { uri: 'not-a-valid-uri' },
      });
      expect(() => validateConfig(config)).toThrow('Database URI format is invalid');
    });

    it('should fail when database URI has invalid protocol', () => {
      const config = createValidConfig({
        database: { uri: 'not-even-a-uri' },
      });
      expect(() => validateConfig(config)).toThrow('Database URI format is invalid');
    });
  });

  describe('JWT Configuration', () => {
    it('should fail when JWT secret is missing', () => {
      const config = createValidConfig({
        jwt: { secret: '' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET must be set');
    });

    it('should fail when JWT secret is null', () => {
      const config = createValidConfig({
        jwt: { secret: null },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET must be set');
    });

    it('should fail when JWT secret contains default value', () => {
      const config = createValidConfig({
        jwt: { secret: 'CHANGE_THIS_SECRET_KEY' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET must be set and not contain default values');
    });

    it('should fail when JWT secret is too short', () => {
      const config = createValidConfig({
        jwt: { secret: 'short' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET should be at least 32 characters long');
    });

    it('should fail when JWT secret is weak (contains "secret")', () => {
      const config = createValidConfig({
        jwt: { secret: 'my-secret-key-for-production-use-12345' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET appears to be weak');
    });

    it('should fail when JWT secret is weak (contains "password")', () => {
      const config = createValidConfig({
        jwt: { secret: 'my-password-key-for-production-12345' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET appears to be weak');
    });

    it('should fail when JWT secret is weak (contains "123456")', () => {
      const config = createValidConfig({
        jwt: { secret: '123456789012345678901234567890123' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET appears to be weak');
    });

    it('should fail when JWT secret is weak (contains "jwt_secret")', () => {
      const config = createValidConfig({
        jwt: { secret: 'jwt_secret_for_production_use_please' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET appears to be weak');
    });

    it('should fail when JWT secret is weak (contains "change_me")', () => {
      const config = createValidConfig({
        jwt: { secret: 'please-change_me-to-something-secure' },
      });
      expect(() => validateConfig(config)).toThrow('JWT_SECRET appears to be weak');
    });
  });

  describe('Security Configuration - CORS', () => {
    it('should fail with invalid CORS origin (not a URL)', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['not-a-valid-url'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('Invalid CORS origins');
    });

    it('should fail with multiple invalid CORS origins', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['not-valid', 'also-invalid'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('Invalid CORS origins');
    });

    it('should fail with mix of valid and invalid CORS origins', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com', 'not-valid'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('Invalid CORS origins');
    });

    it('should pass with empty CORS origin array', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: [],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('Security Configuration - Bcrypt', () => {
    it('should fail when bcrypt rounds is too low (3)', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 3,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('BCRYPT_ROUNDS must be between 4 and 20');
    });

    it('should fail when bcrypt rounds is too high (21)', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 21,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('BCRYPT_ROUNDS must be between 4 and 20');
    });

    it('should fail when bcrypt rounds is 0', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 0,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('BCRYPT_ROUNDS must be between 4 and 20');
    });

    it('should fail when bcrypt rounds is negative', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: -5,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('BCRYPT_ROUNDS must be between 4 and 20');
    });
  });

  describe('Production Environment Validations', () => {
    it('should fail in production with debug logging level', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'debug' },
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('LOG_LEVEL should not be debug in production');
    });

    it('should fail in production without security headers enabled', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'info' },
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 12,
          enableSecurityHeaders: false,
        },
      });
      expect(() => validateConfig(config)).toThrow('Security headers should be enabled in production');
    });

    it('should fail in production with localhost in CORS origins', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'info' },
        security: {
          corsOrigin: 'localhost',
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('CORS_ORIGIN should not include localhost in production');
    });

    it('should fail in production with bcrypt rounds less than 12', () => {});

    it('should fail in production with no CORS origins configured', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'info' },
        security: {
          corsOrigin: null,
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('CORS_ORIGIN should not include localhost in production');
    });

    it('should fail in production with bcrypt rounds less than 12', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'info' },
        security: {
          corsOrigin: ['https://example.com'],
          bcryptRounds: 10,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).toThrow('BCRYPT_ROUNDS should be at least 12 in production');
    });

    it('should pass in production with all proper settings', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'info' },
        security: {
          corsOrigin: ['https://example.com', 'https://api.example.com'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('Development Environment Validations', () => {
    it('should pass in development with debug logging', () => {
      const config = createValidConfig({
        isProduction: false,
        isDevelopment: true,
        logging: { level: 'debug' },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass in development with localhost in CORS', () => {
      const config = createValidConfig({
        isProduction: false,
        isDevelopment: true,
        security: {
          corsOrigin: ['http://localhost:3000'],
          bcryptRounds: 10,
          enableSecurityHeaders: false,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should pass in development with lower bcrypt rounds', () => {
      const config = createValidConfig({
        isProduction: false,
        isDevelopment: true,
        security: {
          corsOrigin: ['http://localhost:3000'],
          bcryptRounds: 4,
          enableSecurityHeaders: false,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should report multiple errors at once', () => {
      const config = createValidConfig({
        database: { uri: '' },
        jwt: { secret: 'short' },
        security: {
          corsOrigin: ['not-valid'],
          bcryptRounds: 3,
          enableSecurityHeaders: true,
        },
      });

      try {
        validateConfig(config);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Database configuration is incomplete');
        expect(error.message).toContain('JWT_SECRET should be at least 32 characters long');
        expect(error.message).toContain('Invalid CORS origins');
        expect(error.message).toContain('BCRYPT_ROUNDS must be between 4 and 20');
      }
    });

    it('should report all production validation errors', () => {
      const config = createValidConfig({
        isProduction: true,
        isDevelopment: false,
        logging: { level: 'debug' },
        security: {
          corsOrigin: ['http://localhost:3000'],
          bcryptRounds: 4,
          enableSecurityHeaders: false,
        },
      });

      try {
        validateConfig(config);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('LOG_LEVEL should not be debug in production');
        expect(error.message).toContain('Security headers should be enabled in production');
        expect(error.message).toContain('BCRYPT_ROUNDS should be at least 12 in production');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config object gracefully', () => {
      const config = {};
      expect(() => validateConfig(config)).toThrow();
    });

    it('should handle config with missing sections', () => {
      const config = {
        database: {},
        jwt: {},
        security: {},
      };
      expect(() => validateConfig(config)).toThrow();
    });

    it('should handle special characters in JWT secret', () => {
      const config = createValidConfig({
        jwt: { secret: 'aB9!@#xY7$%^&*zW4()_+-=[]{}|cD2;:,.<>?~`eF8gH5iJ3kL1mN0oP6qR9sT2uV5wX8yA1bD4' },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should handle Unicode characters in JWT secret', () => {
      const config = createValidConfig({
        jwt: { secret: 'hëllö-wörld-tökén-äüthör-çhårãçtérs-ûñíqüé-str1ng-v4l1d8t10n-t0k3n' },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should handle CORS origin with port numbers', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com:8443', 'http://api.example.com:3000'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should handle CORS origin with paths', () => {
      const config = createValidConfig({
        security: {
          corsOrigin: ['https://example.com/api', 'https://example.com/app'],
          bcryptRounds: 12,
          enableSecurityHeaders: true,
        },
      });
      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});
