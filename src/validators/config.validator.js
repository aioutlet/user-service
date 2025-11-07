/**
 * Configuration Validator
 * Validates all required environment variables at application startup
 * Fails fast if any configuration is missing or invalid
 *
 * NOTE: This module MUST NOT import logger, as the logger depends on validated config.
 * Uses console.log for validation messages.
 */

/**
 * Validates a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a port number
 * @param {string|number} port - The port to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidPort = (port) => {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

/**
 * Validates log level
 * @param {string} level - The log level to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidLogLevel = (level) => {
  const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  return validLevels.includes(level?.toLowerCase());
};

/**
 * Validates NODE_ENV
 * @param {string} env - The environment to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidNodeEnv = (env) => {
  const validEnvs = ['development', 'production', 'test', 'staging'];
  return validEnvs.includes(env?.toLowerCase());
};

/**
 * Configuration validation rules
 */
const validationRules = {
  // Server Configuration
  NODE_ENV: {
    required: true,
    validator: isValidNodeEnv,
    errorMessage: 'NODE_ENV must be one of: development, production, test, staging',
  },
  PORT: {
    required: true,
    validator: isValidPort,
    errorMessage: 'PORT must be a valid port number (1-65535)',
  },
  SERVICE_NAME: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'SERVICE_NAME must be a non-empty string',
  },
  SERVICE_VERSION: {
    required: true,
    validator: (value) => value && /^\d+\.\d+\.\d+/.test(value),
    errorMessage: 'SERVICE_VERSION must be in semantic version format (e.g., 1.0.0)',
  },

  // Database Configuration - Individual MongoDB variables
  MONGO_INITDB_ROOT_USERNAME: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'MONGO_INITDB_ROOT_USERNAME must be a non-empty string',
  },
  MONGO_INITDB_ROOT_PASSWORD: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'MONGO_INITDB_ROOT_PASSWORD must be a non-empty string',
  },
  MONGO_INITDB_DATABASE: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'MONGO_INITDB_DATABASE must be a non-empty string',
  },
  MONGODB_HOST: {
    required: false,
    validator: (value) => !value || value.length > 0,
    errorMessage: 'MONGODB_HOST must be a non-empty string if provided',
    default: 'localhost',
  },
  MONGODB_PORT: {
    required: false,
    validator: (value) => !value || isValidPort(value),
    errorMessage: 'MONGODB_PORT must be a valid port number if provided',
    default: '27017',
  },
  MONGODB_AUTH_SOURCE: {
    required: false,
    validator: (value) => !value || value.length > 0,
    errorMessage: 'MONGODB_AUTH_SOURCE must be a non-empty string if provided',
    default: 'admin',
  },

  // Dapr Configuration
  DAPR_HTTP_PORT: {
    required: false,
    validator: (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 65535),
    errorMessage: 'DAPR_HTTP_PORT must be a valid port number (1-65535)',
  },
  DAPR_HOST: {
    required: false,
    validator: (value) => !value || (typeof value === 'string' && value.length > 0),
    errorMessage: 'DAPR_HOST must be a non-empty string',
  },
  DAPR_PUBSUB_NAME: {
    required: false,
    validator: (value) => !value || (typeof value === 'string' && value.length > 0),
    errorMessage: 'DAPR_PUBSUB_NAME must be a non-empty string',
  },
  DAPR_APP_ID: {
    required: false,
    validator: (value) => !value || (typeof value === 'string' && value.length > 0),
    errorMessage: 'DAPR_APP_ID must be a non-empty string',
  },

  // Security Configuration
  JWT_SECRET: {
    required: true,
    validator: (value) => value && value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters long',
  },
  JWT_EXPIRE: {
    required: true,
    validator: (value) => value && /^\d+[smhd]$/.test(value),
    errorMessage: 'JWT_EXPIRE must be in format like 1h, 24h, 7d, etc.',
  },

  // CORS Configuration
  CORS_ORIGINS: {
    required: true,
    validator: (value) => {
      if (!value) {
        return false;
      }
      const origins = value.split(',').map((o) => o.trim());
      return origins.every((origin) => origin === '*' || isValidUrl(origin));
    },
    errorMessage: 'CORS_ORIGINS must be a comma-separated list of valid URLs or *',
  },

  // Logging Configuration
  LOG_LEVEL: {
    required: false,
    validator: isValidLogLevel,
    errorMessage: 'LOG_LEVEL must be one of: error, warn, info, http, verbose, debug, silly',
    default: 'info',
  },
  LOG_FORMAT: {
    required: false,
    validator: (value) => !value || ['json', 'console'].includes(value?.toLowerCase()),
    errorMessage: 'LOG_FORMAT must be either json or console',
    default: 'console',
  },
  LOG_TO_CONSOLE: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'LOG_TO_CONSOLE must be true or false',
    default: 'true',
  },
  LOG_TO_FILE: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'LOG_TO_FILE must be true or false',
    default: 'false',
  },
  LOG_FILE_PATH: {
    required: false,
    validator: (value) => !value || (value.length > 0 && value.includes('.')),
    errorMessage: 'LOG_FILE_PATH must be a valid file path with extension',
    default: './logs/user-service.log',
  },
  CORRELATION_ID_HEADER: {
    required: false,
    validator: (value) => !value || (value.length > 0 && /^[a-z-]+$/.test(value)),
    errorMessage: 'CORRELATION_ID_HEADER must be lowercase with hyphens only',
    default: 'x-correlation-id',
  },
};

/**
 * Validates all environment variables according to the rules
 * @throws {Error} - If any required variable is missing or invalid
 */
const validateConfig = () => {
  const errors = [];
  const warnings = [];

  console.log('[CONFIG] Validating environment configuration...');

  // Validate each rule
  for (const [key, rule] of Object.entries(validationRules)) {
    const value = process.env[key];

    // Check if required variable is missing
    if (rule.required && !value) {
      errors.push(`❌ ${key} is required but not set`);
      continue;
    }

    // Skip validation if value is not set and not required
    if (!value && !rule.required) {
      if (rule.default) {
        warnings.push(`⚠️  ${key} not set, using default: ${rule.default}`);
        process.env[key] = rule.default;
      }
      continue;
    }

    // Validate the value
    if (value && rule.validator && !rule.validator(value)) {
      errors.push(`❌ ${key}: ${rule.errorMessage}`);
      if (value.length > 100) {
        errors.push(`   Current value: ${value.substring(0, 100)}...`);
      } else {
        errors.push(`   Current value: ${value}`);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(warning));
  }

  // If there are errors, log them and throw
  if (errors.length > 0) {
    console.error('[CONFIG] ❌ Configuration validation failed:');
    errors.forEach((error) => console.error(error));
    console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.');
    throw new Error(`Configuration validation failed with ${errors.length} error(s)`);
  }

  console.log('[CONFIG] ✅ All required environment variables are valid');
};

/**
 * Gets a validated configuration value
 * Assumes validateConfig() has already been called
 * @param {string} key - The configuration key
 * @returns {string} - The configuration value
 */
const getConfig = (key) => {
  return process.env[key];
};

/**
 * Gets a validated configuration value as boolean
 * @param {string} key - The configuration key
 * @returns {boolean} - The configuration value as boolean
 */
const getConfigBoolean = (key) => {
  return process.env[key]?.toLowerCase() === 'true';
};

/**
 * Gets a validated configuration value as number
 * @param {string} key - The configuration key
 * @returns {number} - The configuration value as number
 */
const getConfigNumber = (key) => {
  return parseInt(process.env[key], 10);
};

/**
 * Gets a validated configuration value as array (comma-separated)
 * @param {string} key - The configuration key
 * @returns {string[]} - The configuration value as array
 */
const getConfigArray = (key) => {
  return process.env[key]?.split(',').map((item) => item.trim()) || [];
};

export default validateConfig;
export { getConfig, getConfigBoolean, getConfigNumber, getConfigArray };
