// server/tests/setup.js
process.env.NODE_ENV = 'test';
const { pool } = require('../src/config/db');

// Reset tables before running test suites
async function clearTestDatabase() {
  await pool.query('DELETE FROM readings');
  await pool.query('DELETE FROM users');
}

afterAll(async () => {
  await pool.end();
});

module.exports = {
  clearTestDatabase,
  pool
};

