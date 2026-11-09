// server/src/server.js
const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Verify database connection before listening
pool.query('SELECT NOW()')
  .then((res) => {
    console.log(`[Database] PostgreSQL connected successfully at ${res.rows[0].now}`);
    app.listen(PORT, () => {
      console.log(`[Server] Sweety API server running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('[Database] Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });

