/**
 * Logging module exports
 * Provides centralized access to all logging functionality
 */

import Logger from './logger.js';

// Export the Logger class first
export { Logger };

// Create and export the logger instance after class is defined
const logger = new Logger();
export default logger;

// Export schemas and utilities
export { LOG_LEVELS, DEFAULT_CONFIG, ENVIRONMENT_CONFIGS, validateLogEntry, createBaseLogEntry } from './schemas.js';

// Export formatters
export { createJsonFormat, createConsoleFormat } from './formatters.js';
