// database/seed.js
const path = require('path');

// Resolve modules from server/node_modules if not in root
const serverModules = path.join(__dirname, '../server/node_modules');
const pg = require(path.join(serverModules, 'pg'));
const bcrypt = require(path.join(serverModules, 'bcrypt'));
const dotenv = require(path.join(serverModules, 'dotenv'));

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety_db'
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding Sweety database with demo accounts...');
    await client.query('BEGIN');

    // Dedicated demo password for assignment only
    const demoPassword = 'KKrds3j9#K';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    // Upsert primary user: Kalyany Nikunjam (preserves exact email with Gmail dot)
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email`,
      ['Kalyany Nikunjam', 'kalyany.nikunjam@gmail.com', passwordHash]
    );
    const kalyaniId = userRes.rows[0].id;

    // Upsert secondary user: Kalyany Sanal (preserves exact email)
    const sanalRes = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email`,
      ['Kalyany Sanal', 'kalyanysanal@gmail.com', passwordHash]
    );
    const sanalId = sanalRes.rows[0].id;

    console.log(`Demo accounts synchronized successfully:`);
    console.log(`- Kalyany Nikunjam (ID: ${kalyaniId}, Email: kalyany.nikunjam@gmail.com, Password: ${demoPassword})`);
    console.log(`- Kalyany Sanal (ID: ${sanalId}, Email: kalyanysanal@gmail.com, Password: ${demoPassword})`);

    // Clean existing readings for these demo accounts to ensure repeatable idempotency
    await client.query('DELETE FROM readings WHERE user_id = $1 OR user_id = $2', [kalyaniId, sanalId]);

    // Helper to format date YYYY-MM-DD
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const todayStr = formatDate(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = formatDate(fiveDaysAgo);

    // Previous calendar month dates
    const prevMonthDate1 = new Date(now.getFullYear(), now.getMonth() - 1, 10);
    const prevMonthDate2 = new Date(now.getFullYear(), now.getMonth() - 1, 20);
    const prevMonth1Str = formatDate(prevMonthDate1);
    const prevMonth2Str = formatDate(prevMonthDate2);

    const sampleReadings = [
      // Today (4 full readings)
      { date: todayStr, slot: 'Morning (fasting)', value: 92 },
      { date: todayStr, slot: 'After breakfast', value: 135 },
      { date: todayStr, slot: 'After lunch', value: 142 },
      { date: todayStr, slot: 'After dinner', value: 128 },

      // Yesterday (3 readings)
      { date: yesterdayStr, slot: 'Morning (fasting)', value: 98 },
      { date: yesterdayStr, slot: 'After breakfast', value: 140 },
      { date: yesterdayStr, slot: 'After dinner', value: 130 },

      // 5 days ago (2 readings)
      { date: fiveDaysAgoStr, slot: 'Morning (fasting)', value: 95 },
      { date: fiveDaysAgoStr, slot: 'After lunch', value: 148 },

      // Previous month readings (for Monthly Report testing)
      { date: prevMonth1Str, slot: 'Morning (fasting)', value: 102 },
      { date: prevMonth1Str, slot: 'After lunch', value: 155 },
      { date: prevMonth2Str, slot: 'Morning (fasting)', value: 94 },
      { date: prevMonth2Str, slot: 'After dinner', value: 138 }
    ];

    for (const r of sampleReadings) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2, $3, $4)`,
        [kalyaniId, r.date, r.slot, r.value]
      );
    }

    // Sample isolated reading for Kalyany Sanal
    await client.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)`,
      [sanalId, todayStr, 'Morning (fasting)', 110]
    );

    await client.query('COMMIT');
    console.log(`Successfully seeded ${sampleReadings.length} readings for Kalyany Nikunjam and 1 reading for Kalyany Sanal.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
