// server/tests/readings.test.js
const request = require('supertest');
const app = require('../src/app');
const { pool, clearTestDatabase } = require('./setup');
const { getTodayString } = require('../src/utils/dateUtils');

describe('Glucose Readings API', () => {
  let userToken;
  let user2Token;
  let today;

  beforeEach(async () => {
    await clearTestDatabase();
    today = getTodayString();

    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123!'
      });
    userToken = res1.body.token;

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password123!'
      });
    user2Token = res2.body.token;
  });

  describe('POST /api/readings (Add Reading)', () => {
    it('should successfully add a valid reading across all four slots', async () => {
      const slots = [
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner'
      ];

      for (const slot of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            reading_date: today,
            time_slot: slot,
            glucose_value: 105
          });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.reading.time_slot).toBe(slot);
      }
    });

    it('should reject reading with glucose value below 40', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 39
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 40 and 600');
    });

    it('should reject reading with glucose value above 600', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 601
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 40 and 600');
    });

    it('should reject decimal or non-integer glucose values', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 120.5
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/whole number/i);
    });

    it('should reject invalid time slot', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Midnight snack',
          glucose_value: 120
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Time slot must be one of');
    });

    it('should reject a reading date in the future', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      const futureDate = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: futureDate,
          time_slot: 'Morning (fasting)',
          glucose_value: 110
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot be in the future');
    });

    it('should reject duplicate reading in the same time slot on the same date for the same user', async () => {
      // First reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 95
        });

      // Second reading same date and slot
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 105
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should enforce maximum four readings per day', async () => {
      const slots = [
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner'
      ];

      // Add all 4 slots
      for (const slot of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            reading_date: today,
            time_slot: slot,
            glucose_value: 100
          });
        expect(res.status).toBe(201);
      }

      // Attempt a 5th reading on same date
      const extraRes = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 115
        });

      expect([400, 409]).toContain(extraRes.status);
      expect(extraRes.body.success).toBe(false);
    });

    it('should handle concurrent duplicate requests safely preventing double insertion', async () => {
      // Fire 3 concurrent requests for the exact same slot
      const promises = [1, 2, 3].map(() =>
        request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            reading_date: today,
            time_slot: 'Morning (fasting)',
            glucose_value: 99
          })
      );

      const responses = await Promise.all(promises);
      const successes = responses.filter((r) => r.status === 201);
      const conflicts = responses.filter((r) => r.status === 409);

      expect(successes.length).toBe(1);
      expect(conflicts.length).toBe(2);

      // Verify DB has exactly 1 record
      const dbCheck = await pool.query(
        'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = (SELECT id FROM users WHERE email = $1) AND reading_date = $2',
        ['user1@example.com', today]
      );
      expect(dbCheck.rows[0].count).toBe(1);
    });
  });

  describe('Reading Ownership & Data Isolation', () => {
    let user1ReadingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 99
        });
      user1ReadingId = res.body.reading.id;
    });

    it('should only return readings belonging to the authenticated user', async () => {
      // User 2 adds a reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 150
        });

      // User 1 gets readings
      const res1 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.readings.length).toBe(1);
      expect(res1.body.readings[0].glucose_value).toBe(99);

      // User 2 gets readings
      const res2 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.readings.length).toBe(1);
      expect(res2.body.readings[0].glucose_value).toBe(150);
    });

    it('should prevent User 2 from viewing User 1 reading', async () => {
      const res = await request(app)
        .get(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should prevent User 2 from updating User 1 reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reading_date: today,
          time_slot: 'Morning (fasting)',
          glucose_value: 130
        });

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Verify value was NOT changed in DB
      const dbCheck = await pool.query('SELECT glucose_value FROM readings WHERE id = $1', [user1ReadingId]);
      expect(dbCheck.rows[0].glucose_value).toBe(99);
    });

    it('should prevent User 2 from deleting User 1 reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Verify still exists in DB
      const dbCheck = await pool.query('SELECT id FROM readings WHERE id = $1', [user1ReadingId]);
      expect(dbCheck.rows.length).toBe(1);
    });

    it('should allow User 1 to update own reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'After breakfast',
          glucose_value: 135
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reading.glucose_value).toBe(135);
      expect(res.body.reading.time_slot).toBe('After breakfast');
    });

    it('should reject updating reading with invalid glucose value', async () => {
      const res = await request(app)
        .put(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'After breakfast',
          glucose_value: 750
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 40 and 600/i);
    });

    it('should allow User 1 to delete own reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${user1ReadingId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbCheck = await pool.query('SELECT id FROM readings WHERE id = $1', [user1ReadingId]);
      expect(dbCheck.rows.length).toBe(0);
    });
  });
});
