// server/src/controllers/readingsController.js
const db = require('../config/db');
const { isDateInFuture } = require('../utils/dateUtils');

/**
 * Add a new glucose reading
 * POST /api/readings
 */
async function createReading(req, res, next) {
  try {
    const userId = req.user.id;
    const { reading_date, time_slot, glucose_value } = req.body;

    // Check future date
    if (isDateInFuture(reading_date)) {
      return res.status(400).json({
        success: false,
        message: 'Reading date cannot be in the future.'
      });
    }

    // Check count for the day (maximum 4 readings per day)
    const countResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, reading_date]
    );

    if (countResult.rows[0].count >= 4) {
      return res.status(400).json({
        success: false,
        message: 'Maximum four readings per day limit reached for this date.'
      });
    }

    // Check if slot already exists for user on this date
    const existingSlot = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [userId, reading_date, time_slot]
    );

    if (existingSlot.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A reading for '${time_slot}' on ${reading_date} already exists.`
      });
    }

    // Insert reading
    const insertResult = await db.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, time_slot, glucose_value, created_at, updated_at`,
      [userId, reading_date, time_slot, parseInt(glucose_value, 10)]
    );

    return res.status(201).json({
      success: true,
      message: 'Glucose reading added successfully.',
      reading: insertResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all readings for authenticated user
 * GET /api/readings
 */
async function getReadings(req, res, next) {
  try {
    const userId = req.user.id;
    const { date, start_date, end_date, time_slot, sort = 'DESC' } = req.query;

    const conditions = ['user_id = $1'];
    const params = [userId];
    let paramIndex = 2;

    if (date) {
      conditions.push(`reading_date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`reading_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`reading_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (time_slot) {
      conditions.push(`time_slot = $${paramIndex}`);
      params.push(time_slot);
      paramIndex++;
    }

    const sortOrder = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT 
        id, 
        user_id, 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, 
        time_slot, 
        glucose_value, 
        created_at, 
        updated_at
      FROM readings
      WHERE ${conditions.join(' AND ')}
      ORDER BY reading_date ${sortOrder},
        CASE time_slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    const result = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      readings: result.rows
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single reading by ID
 * GET /api/readings/:id
 */
async function getReadingById(req, res, next) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    const result = await db.query(
      `SELECT 
        id, 
        user_id, 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, 
        time_slot, 
        glucose_value, 
        created_at, 
        updated_at
      FROM readings
      WHERE id = $1 AND user_id = $2`,
      [readingId, userId]
    );

    if (result.rows.length === 0) {
      // Check if it exists for another user to give appropriate ownership feedback
      const existsOther = await db.query('SELECT id FROM readings WHERE id = $1', [readingId]);
      if (existsOther.rows.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this reading.'
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found.'
      });
    }

    return res.status(200).json({
      success: true,
      reading: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Edit an existing glucose reading
 * PUT /api/readings/:id
 */
async function updateReading(req, res, next) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);
    const { reading_date, time_slot, glucose_value } = req.body;

    // Check future date
    if (isDateInFuture(reading_date)) {
      return res.status(400).json({
        success: false,
        message: 'Reading date cannot be in the future.'
      });
    }

    // Verify reading ownership
    const checkReading = await db.query(
      'SELECT id, user_id FROM readings WHERE id = $1',
      [readingId]
    );

    if (checkReading.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found.'
      });
    }

    if (checkReading.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to edit this reading.'
      });
    }

    // Check duplicate slot if date or slot is changing
    const duplicateCheck = await db.query(
      `SELECT id FROM readings 
       WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id <> $4`,
      [userId, reading_date, time_slot, readingId]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A reading for '${time_slot}' on ${reading_date} already exists.`
      });
    }

    // Execute update
    const updateResult = await db.query(
      `UPDATE readings
       SET reading_date = $1,
           time_slot = $2,
           glucose_value = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, time_slot, glucose_value, created_at, updated_at`,
      [reading_date, time_slot, parseInt(glucose_value, 10), readingId, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Glucose reading updated successfully.',
      reading: updateResult.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a glucose reading
 * DELETE /api/readings/:id
 */
async function deleteReading(req, res, next) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    // Verify reading ownership
    const checkReading = await db.query(
      'SELECT id, user_id FROM readings WHERE id = $1',
      [readingId]
    );

    if (checkReading.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found.'
      });
    }

    if (checkReading.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete this reading.'
      });
    }

    await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2',
      [readingId, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Glucose reading deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading
};

