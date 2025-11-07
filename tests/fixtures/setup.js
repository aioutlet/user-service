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

// Note: Mocking should be done in individual test files, not in setup files with ESM
// Each test file should use jest.mock() at the top of the file
