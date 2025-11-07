/**
 * Configuration module for user-service
 * Centralizes all environment-based configuration (non-sensitive only)
 *
 * For sensitive secrets (database credentials, JWT secrets), use:
 * - import { getDatabaseConfig, getJwtConfig } from '../services/dapr.secretManager.js'
 */

export default {
  service: {
    name: process.env.NAME || 'user-service',
    version: process.env.VERSION || '1.0.0',
    port: parseInt(process.env.PORT, 10) || 3002,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3010'],
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'console',
    toConsole: process.env.LOG_TO_CONSOLE === 'true',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/user-service.log',
  },

  observability: {
    enableTracing: process.env.ENABLE_TRACING === 'true',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    correlationIdHeader: process.env.CORRELATION_ID_HEADER || 'x-correlation-id',
  },

  dapr: {
    httpPort: parseInt(process.env.DAPR_HTTP_PORT, 10) || 3502,
    host: process.env.DAPR_HOST || 'localhost',
    pubsubName: process.env.DAPR_PUBSUB_NAME || 'user-pubsub',
    appId: process.env.DAPR_APP_ID || 'user-service',
  },
};
