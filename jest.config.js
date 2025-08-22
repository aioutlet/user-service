export default {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
};
