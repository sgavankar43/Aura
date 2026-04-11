/**
 * Test setup file — runs before all tests.
 * Configures environment variables and global test utilities.
 */

// Ensure test environment
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '0'; // Random port for tests
process.env['CORS_ORIGIN'] = 'http://localhost:5173';
process.env['LOG_LEVEL'] = 'silent'; // Suppress logs during tests
process.env['RATE_LIMIT_WINDOW_MS'] = '900000';
process.env['RATE_LIMIT_MAX_REQUESTS'] = '1000'; // High limit for tests
