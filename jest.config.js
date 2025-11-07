export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/fixtures/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000,
  transform: {},
  // Exclude fixtures files that aren't test files
  testPathIgnorePatterns: ['/node_modules/', '/tests/fixtures/(?!.*\\.test\\.js$)'],
};
