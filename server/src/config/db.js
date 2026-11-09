// server/src/config/db.js
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isTest = process.env.NODE_ENV === 'test';
const connectionString = isTest
  ? (process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety_test_db')
  : (process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety_db');

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
