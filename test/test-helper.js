const supertest = require('supertest');
const app = require('../app');
const db = require('../config/database');
const setupTestDB = require('./setup');

// Create a test agent
const request = supertest.agent(app);

// Test user credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'user@test.com',
  password: process.env.TEST_USER_PASSWORD || 'User@123'
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123'
};

// Helper functions
const loginUser = async (credentials = TEST_USER) => {
  const res = await request
    .post('/auth/login')
    .send(credentials);
  return res.headers['set-cookie'];
};

const cleanupDB = async () => {
  // Clean up test database after tests
  await db.migrate.rollback();
  await db.migrate.latest();
  await db.seed.run();
};

module.exports = {
  request,
  TEST_USER,
  TEST_ADMIN,
  loginUser,
  cleanupDB,
  setupTestDB
};
