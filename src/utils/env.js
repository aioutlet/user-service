/**
 * Environment variable utility functions
 */

/**
 * Validate required environment variables
 */
export const validateRequired = (key, defaultValue = null) => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

/**
 * Get boolean environment variable
 */
export const getBoolean = (key, defaultValue = false) => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
};

/**
 * Get integer environment variable
 */
export const getInteger = (key, defaultValue = null) => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`);
  }
  return parsed;
};

/**
 * Get string array from comma-separated environment variable
 */
export const getStringArray = (key, defaultValue = []) => {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  return value.split(',').map((item) => item.trim());
};

/**
 * Build MongoDB connection string
 */
export const buildMongoDBUri = () => {
  // If MONGODB_URI is provided directly, use it
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  // Build from individual components
  const {
    MONGODB_CONNECTION_SCHEME = 'mongodb',
    MONGODB_HOST,
    MONGODB_PORT = '27017',
    MONGODB_USERNAME,
    MONGODB_PASSWORD,
    MONGODB_DB_NAME,
    MONGODB_DB_PARAMS = '',
  } = process.env;

  if (!MONGODB_HOST || !MONGODB_DB_NAME) {
    throw new Error('MONGODB_HOST and MONGODB_DB_NAME must be defined (or provide MONGODB_URI directly)');
  }

  let uri = `${MONGODB_CONNECTION_SCHEME}://`;

  if (MONGODB_USERNAME && MONGODB_PASSWORD) {
    uri += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
  }

  uri += `${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DB_NAME}`;

  if (MONGODB_DB_PARAMS) {
    uri += `?${MONGODB_DB_PARAMS}`;
  }

  return uri;
};
