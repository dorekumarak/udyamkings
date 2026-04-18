const { request, TEST_USER, setupTestDB } = require('./test-helper');
const db = require('../config/database');

describe('Authentication', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        name: 'Test User',
        email: 'newuser@test.com',
        password: 'Test@123',
        confirmPassword: 'Test@123'
      };

      const res = await request
        .post('/auth/register')
        .send(newUser);

      expect(res.status).toBe(302); // Redirect after successful registration
      expect(res.headers.location).toBe('/dashboard');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request
        .post('/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });

      expect(res.status).toBe(302); // Redirect after successful login
      expect(res.headers.location).toBe('/dashboard');
    });
  });
});
