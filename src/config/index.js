/**
 * Application Configuration
 */

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
    port: parseInt(process.env.PORT, 10) || 3002,
    host: process.env.HOST || '0.0.0.0',
  },

  // Database
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // External Services
  services: {
    audit: process.env.AUDIT_SERVICE_URL || 'http://localhost:3007',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    corsOrigin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000'],
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS === 'true',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toConsole: process.env.LOG_TO_CONSOLE !== 'false',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/user-service.log',
  },
};

export default config;
