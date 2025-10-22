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

  // Message Broker Configuration
  MESSAGE_BROKER_TYPE: {
    required: true,
    validator: (value) => ['rabbitmq', 'kafka', 'azure-servicebus'].includes(value?.toLowerCase()),
    errorMessage: 'MESSAGE_BROKER_TYPE must be one of: rabbitmq, kafka, azure-servicebus',
  },
  MESSAGE_BROKER_SERVICE_URL: {
    required: true,
    validator: isValidUrl,
    errorMessage: 'MESSAGE_BROKER_SERVICE_URL must be a valid URL',
  },
  MESSAGE_BROKER_API_KEY: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'MESSAGE_BROKER_API_KEY must be a non-empty string',
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

  // Observability Configuration
  ENABLE_TRACING: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'ENABLE_TRACING must be true or false',
    default: 'false',
  },
  OTEL_EXPORTER_OTLP_ENDPOINT: {
    required: false,
    validator: (value) => !value || isValidUrl(value),
    errorMessage: 'OTEL_EXPORTER_OTLP_ENDPOINT must be a valid URL',
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

  // Conditional validation based on MESSAGE_BROKER_TYPE
  const brokerType = process.env.MESSAGE_BROKER_TYPE?.toLowerCase();
  if (brokerType) {
    console.log(`[CONFIG] Validating ${brokerType} broker configuration...`);

    if (brokerType === 'rabbitmq') {
      const rabbitMqVars = {
        RABBITMQ_URL: {
          validator: (value) => value && value.startsWith('amqp'),
          errorMessage: 'RABBITMQ_URL must be a valid AMQP connection string',
        },
        RABBITMQ_EXCHANGE: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'RABBITMQ_EXCHANGE must be a non-empty string',
        },
        RABBITMQ_QUEUE_ORDER_COMPLETED: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'RABBITMQ_QUEUE_ORDER_COMPLETED must be a non-empty string',
        },
        RABBITMQ_QUEUE_FRAUD_DETECTED: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'RABBITMQ_QUEUE_FRAUD_DETECTED must be a non-empty string',
        },
        RABBITMQ_QUEUE_PAYMENT_MILESTONE: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'RABBITMQ_QUEUE_PAYMENT_MILESTONE must be a non-empty string',
        },
      };

      for (const [key, rule] of Object.entries(rabbitMqVars)) {
        const value = process.env[key];
        if (!value) {
          errors.push(`❌ ${key} is required when MESSAGE_BROKER_TYPE=rabbitmq`);
        } else if (!rule.validator(value)) {
          errors.push(`❌ ${key}: ${rule.errorMessage}`);
        }
      }
    } else if (brokerType === 'kafka') {
      const kafkaVars = {
        KAFKA_BROKERS: {
          validator: (value) => value && value.includes(':'),
          errorMessage: 'KAFKA_BROKERS must be comma-separated host:port pairs',
        },
        KAFKA_CLIENT_ID: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'KAFKA_CLIENT_ID must be a non-empty string',
        },
        KAFKA_GROUP_ID: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'KAFKA_GROUP_ID must be a non-empty string',
        },
        KAFKA_TOPIC_ORDER_COMPLETED: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'KAFKA_TOPIC_ORDER_COMPLETED must be a non-empty string',
        },
        KAFKA_TOPIC_FRAUD_DETECTED: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'KAFKA_TOPIC_FRAUD_DETECTED must be a non-empty string',
        },
        KAFKA_TOPIC_PAYMENT_MILESTONE: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'KAFKA_TOPIC_PAYMENT_MILESTONE must be a non-empty string',
        },
      };

      for (const [key, rule] of Object.entries(kafkaVars)) {
        const value = process.env[key];
        if (!value) {
          errors.push(`❌ ${key} is required when MESSAGE_BROKER_TYPE=kafka`);
        } else if (!rule.validator(value)) {
          errors.push(`❌ ${key}: ${rule.errorMessage}`);
        }
      }
    } else if (brokerType === 'azure-servicebus') {
      const azureVars = {
        AZURE_SERVICEBUS_CONNECTION_STRING: {
          validator: (value) => value && value.includes('Endpoint=') && value.includes('SharedAccessKey='),
          errorMessage: 'AZURE_SERVICEBUS_CONNECTION_STRING must be a valid Azure Service Bus connection string',
        },
        AZURE_SERVICEBUS_QUEUE_ORDER_COMPLETED: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'AZURE_SERVICEBUS_QUEUE_ORDER_COMPLETED must be a non-empty string',
        },
        AZURE_SERVICEBUS_QUEUE_FRAUD_DETECTED: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'AZURE_SERVICEBUS_QUEUE_FRAUD_DETECTED must be a non-empty string',
        },
        AZURE_SERVICEBUS_QUEUE_PAYMENT_MILESTONE: {
          validator: (value) => value && value.length > 0,
          errorMessage: 'AZURE_SERVICEBUS_QUEUE_PAYMENT_MILESTONE must be a non-empty string',
        },
      };

      for (const [key, rule] of Object.entries(azureVars)) {
        const value = process.env[key];
        if (!value) {
          errors.push(`❌ ${key} is required when MESSAGE_BROKER_TYPE=azure-servicebus`);
        } else if (!rule.validator(value)) {
          errors.push(`❌ ${key}: ${rule.errorMessage}`);
        }
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
