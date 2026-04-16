module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
  ],
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['./test/setup.js'],
  testTimeout: 30000,
};
