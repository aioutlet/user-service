/**
 * Test Fixtures - Central export for test utilities and data
 */

// Re-export setup utilities
export * from './setup.js';

// Test data helpers
export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  password: 'hashedPassword123',
  phoneNumber: '+1234567890',
  isEmailVerified: true,
  isActive: true,
  roles: ['customer'],
  tier: 'standard',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockAdmin = {
  _id: '507f1f77bcf86cd799439012',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  displayName: 'Admin User',
  password: 'hashedPassword123',
  phoneNumber: '+1234567891',
  isEmailVerified: true,
  isActive: true,
  roles: ['admin'],
  tier: 'premium',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUserRequest = {
  email: 'newuser@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  password: 'SecurePass123!',
  phoneNumber: '+1234567892',
};

export const mockCorrelationId = 'test-correlation-id-123';
export const mockClientIP = '127.0.0.1';
export const mockUserAgent = 'Jest Test Suite';
