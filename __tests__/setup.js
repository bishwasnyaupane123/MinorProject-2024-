// Set test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Increase timeout for tests
jest.setTimeout(30000); 