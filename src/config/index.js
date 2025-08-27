/**
 * Application Configuration
 */
import { validateRequired, getBoolean, getInteger, getStringArray, buildMongoDBUri } from '../utils/env.js';

/**
 * Configuration object
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

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

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toConsole: getBoolean('LOG_TO_CONSOLE', true),
    toFile: getBoolean('LOG_TO_FILE', false),
    filePath: process.env.LOG_FILE_PATH || 'logs/user-service.log',
  },
};

export default config;
