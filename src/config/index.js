/**
 * Application Configuration
 */
import { validateRequired, getBoolean, getInteger, getStringArray, buildMongoDBUri } from '../utils/env.js';

/**
 * Configuration object
 */
export const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',

  // Server
  server: {
    port: getInteger('PORT', 3002),
    host: process.env.HOST || '0.0.0.0',
  },

  // Database
  database: {
    uri: buildMongoDBUri(),
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT
  jwt: {
    secret: validateRequired('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // External Services
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    audit: process.env.AUDIT_SERVICE_URL || 'http://localhost:3007',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  },

  // Security
  security: {
    bcryptRounds: getInteger('BCRYPT_ROUNDS', 12),
    corsOrigin: getStringArray('CORS_ORIGIN', ['http://localhost:3000']),
    enableSecurityHeaders: getBoolean('ENABLE_SECURITY_HEADERS', false),
    enableRateLimiting: getBoolean('ENABLE_RATE_LIMITING', true),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getInteger('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    maxRequests: getInteger('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toConsole: getBoolean('LOG_TO_CONSOLE', true),
    toFile: getBoolean('LOG_TO_FILE', false),
    filePath: process.env.LOG_FILE_PATH || 'logs/user-service.log',
  },

  // OpenTelemetry
  telemetry: {
    serviceName: process.env.OTEL_SERVICE_NAME || 'user-service',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    enabled: getBoolean('OTEL_ENABLED', false),
  },

  // Health Check
  healthCheck: {
    enabled: getBoolean('HEALTH_CHECK_ENABLED', true),
    interval: getInteger('HEALTH_CHECK_INTERVAL', 30000),
  },

  // Performance
  performance: {
    enableCompression: getBoolean('ENABLE_COMPRESSION', true),
    enableCaching: getBoolean('ENABLE_CACHING', false),
  },

  // Development
  development: {
    hotReload: getBoolean('HOT_RELOAD', false),
    debugMode: getBoolean('DEBUG_MODE', false),
  },
};

/**
 * Validate configuration
 */
export const validateConfig = () => {
  const errors = [];

  // Check required fields
  if (!config.jwt.secret || config.jwt.secret.includes('CHANGE_THIS')) {
    errors.push('JWT_SECRET must be set and not contain default values');
  }

  if (config.jwt.secret && config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }

  if (!config.database.uri) {
    errors.push('Database configuration is incomplete');
  }

  // Production-specific validations
  if (config.isProduction) {
    if (config.development.debugMode) {
      errors.push('DEBUG_MODE should be false in production');
    }

    if (config.logging.level === 'debug') {
      errors.push('LOG_LEVEL should not be debug in production');
    }

    if (!config.security.enableSecurityHeaders) {
      errors.push('Security headers should be enabled in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  console.log('✅ Configuration validation passed');
};

export default config;
