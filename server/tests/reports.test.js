// server/tests/reports.test.js
const request = require('supertest');
const app = require('../src/app');
const { clearTestDatabase } = require('./setup');
const { getTodayString } = require('../src/utils/dateUtils');

describe('Reports API', () => {
  let userToken;
  let today;

  beforeEach(async () => {
    await clearTestDatabase();
    today = getTodayString();

    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Report Tester',
        email: 'report@example.com',
        password: 'Password123!'
      });
    userToken = reg.body.token;
  });

  describe('GET /api/reports/daily', () => {
    it('should return friendly empty state when no readings exist for selected date', async () => {
      const res = await request(app)
        .get(`/api/reports/daily?date=${today}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.highest).toBeNull();
      expect(res.body.lowest).toBeNull();
      expect(res.body.average).toBeNull();
      expect(res.body.readings).toEqual([]);
    });

    it('should calculate daily metrics accurately with 1 decimal place average', async () => {
      // Add readings: 90, 135, 142
      // Average: (90 + 135 + 142) / 3 = 367 / 3 = 122.333... -> 122.3
      const readings = [
        { slot: 'Morning (fasting)', value: 90 },
        { slot: 'After breakfast', value: 135 },
        { slot: 'After lunch', value: 142 }
      ];

      for (const r of readings) {
        await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            reading_date: today,
            time_slot: r.slot,
            glucose_value: r.value
          });
      }

      const res = await request(app)
        .get(`/api/reports/daily?date=${today}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(false);
      expect(res.body.count).toBe(3);
      expect(res.body.highest).toBe(142);
      expect(res.body.lowest).toBe(90);
      expect(res.body.average).toBe(122.3);
      expect(res.body.readings.length).toBe(3);
      expect(res.body.readings[0].time_slot).toBe('Morning (fasting)');
    });
  });

  describe('GET /api/reports/month-to-date', () => {
    it('should return empty state when no readings exist month-to-date', async () => {
      const res = await request(app)
        .get(`/api/reports/month-to-date?date=${today}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.highest).toBeNull();
      expect(res.body.lowest).toBeNull();
      expect(res.body.average).toBeNull();
    });

    it('should calculate month-to-date metrics from 1st of month to selected date', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const firstOfMonth = `${year}-${month}-01`;

      // Reading on 1st of month
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: firstOfMonth,
          time_slot: 'Morning (fasting)',
          glucose_value: 95
        });

      // Reading today
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: today,
          time_slot: 'After dinner',
          glucose_value: 125
        });

      const res = await request(app)
        .get(`/api/reports/month-to-date?date=${today}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(false);
      expect(res.body.count).toBe(2);
      expect(res.body.highest).toBe(125);
      expect(res.body.lowest).toBe(95);
      expect(res.body.average).toBe(110.0);
    });
  });

  describe('GET /api/reports/monthly (Previous Calendar Month)', () => {
    it('should return empty state when no readings exist for previous month', async () => {
      const res = await request(app)
        .get(`/api/reports/monthly?date=${today}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.highest).toBeNull();
      expect(res.body.lowest).toBeNull();
      expect(res.body.average).toBeNull();
      expect(res.body.targetMonth).toBeDefined();
    });

    it('should calculate metrics for entire previous calendar month', async () => {
      const now = new Date();
      const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevMonthPadded = String(prevMonthNum).padStart(2, '0');

      const dateInPrevMonth = `${prevMonthYear}-${prevMonthPadded}-15`;

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: dateInPrevMonth,
          time_slot: 'Morning (fasting)',
          glucose_value: 100
        });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: dateInPrevMonth,
          time_slot: 'After lunch',
          glucose_value: 140
        });

      const res = await request(app)
        .get(`/api/reports/monthly?date=${today}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(false);
      expect(res.body.count).toBe(2);
      expect(res.body.highest).toBe(140);
      expect(res.body.lowest).toBe(100);
      expect(res.body.average).toBe(120.0);
      expect(res.body.targetMonth.year).toBe(prevMonthYear);
      expect(res.body.targetMonth.month).toBe(prevMonthNum);
    });

    it('should accurately handle year-boundary transition for January query dates', async () => {
      // Add readings in December 2025
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: '2025-12-10',
          time_slot: 'Morning (fasting)',
          glucose_value: 90
        });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reading_date: '2025-12-25',
          time_slot: 'After dinner',
          glucose_value: 150
        });

      // Query with a January 2026 date: previous calendar month must be December 2025
      const res = await request(app)
        .get('/api/reports/monthly?date=2026-01-15')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.empty).toBe(false);
      expect(res.body.targetMonth.year).toBe(2025);
      expect(res.body.targetMonth.month).toBe(12);
      expect(res.body.targetMonth.startDate).toBe('2025-12-01');
      expect(res.body.targetMonth.endDate).toBe('2025-12-31');
      expect(res.body.highest).toBe(150);
      expect(res.body.lowest).toBe(90);
      expect(res.body.average).toBe(120.0);
      expect(res.body.count).toBe(2);
    });
  });
});
