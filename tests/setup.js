/**
 * Jest test setup file
 * This runs before each test file
 */
import dotenv from 'dotenv';

// Set test environment
process.env.NODE_ENV = 'test';

// Load test environment variables
dotenv.config({ path: '.env.test' });

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
