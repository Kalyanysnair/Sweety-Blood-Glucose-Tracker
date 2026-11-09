// server/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const { pool, clearTestDatabase } = require('./setup');
const bcrypt = require('bcrypt');

describe('Authentication API', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with hashed string password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Nikunjam',
          email: 'kalyany.nikunjam@gmail.com',
          password: 'KKrds3j9#K'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('kalyany.nikunjam@gmail.com');
      expect(res.body.user.name).toBe('Kalyany Nikunjam');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();

      // Verify in DB that plaintext password is NOT stored
      const dbUser = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['kalyany.nikunjam@gmail.com']);
      expect(dbUser.rows.length).toBe(1);
      expect(dbUser.rows[0].password_hash).not.toBe('KKrds3j9#K');
      const match = await bcrypt.compare('KKrds3j9#K', dbUser.rows[0].password_hash);
      expect(match).toBe(true);
    });

    it('should reject registration when password is not a string', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Nikunjam',
          email: 'kalyany.nikunjam@gmail.com',
          password: 12345678
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/string/i);
    });

    it('should reject registration with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'kalyany.nikunjam@gmail.com',
          password: 'KKrds3j9#K'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Name is required');
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Sanal',
          email: 'invalid-email',
          password: 'KKrds3j9#K'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('valid email');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Sanal',
          email: 'kalyanysanal@gmail.com',
          password: '123'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 6 characters');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Nikunjam',
          email: 'kalyany.nikunjam@gmail.com',
          password: 'KKrds3j9#K'
        });

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Nikunjam Duplicate',
          email: 'kalyany.nikunjam@gmail.com',
          password: 'KKrds3j9#KSecond'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Nikunjam',
          email: 'kalyany.nikunjam@gmail.com',
          password: 'KKrds3j9#K'
        });
    });

    it('should log in successfully with valid string credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'kalyany.nikunjam@gmail.com',
          password: 'KKrds3j9#K'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('kalyany.nikunjam@gmail.com');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('should reject login when password is not a string', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'kalyany.nikunjam@gmail.com',
          password: 123456
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/string/i);
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'kalyany.nikunjam@gmail.com',
          password: 'WrongPassword#'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unregistered@gmail.com',
          password: 'KKrds3j9#K'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });
  });

  describe('Protected Route Access & Verification', () => {
    it('should reject access to protected endpoint without token', async () => {
      const res = await request(app).get('/api/readings');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No authentication token');
    });

    it('should reject access with malformed token', async () => {
      const res = await request(app)
        .get('/api/readings')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid authentication token');
    });

    it('should allow access to /api/auth/me with valid token', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Kalyany Sanal',
          email: 'kalyanysanal@gmail.com',
          password: 'KKrds3j9#K'
        });

      const token = regRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('kalyanysanal@gmail.com');
      expect(res.body.user.password_hash).toBeUndefined();
    });
  });
});
