/**
 * Jest test setup file
 * This runs before each test file
 */
import dotenv from 'dotenv';

// Load environment variables from .env file
// This ensures tests validate the actual .env configuration
dotenv.config({ quiet: true });

// Only override NODE_ENV to ensure we're in test mode
process.env.NODE_ENV = 'test';

// Mock console.log and console.error to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock the logger to prevent winston issues
jest.mock('../src/observability/index.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  business: jest.fn(),
  security: jest.fn(),
  operation: jest.fn(),
  fatal: jest.fn(),
}));
