// server/src/controllers/reportsController.js
const db = require('../config/db');
const {
  getTodayString,
  getMonthToDateRange,
  getPreviousMonthRange
} = require('../utils/dateUtils');

/**
 * Get Daily Report
 * GET /api/reports/daily?date=YYYY-MM-DD
 */
async function getDailyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();

    const readingsQuery = `
      SELECT 
        id, 
        user_id, 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, 
        time_slot, 
        glucose_value, 
        created_at
      FROM readings
      WHERE user_id = $1 AND reading_date = $2
      ORDER BY 
        CASE time_slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    const result = await db.query(readingsQuery, [userId, selectedDate]);
    const readings = result.rows;
    const count = readings.length;

    if (count === 0) {
      return res.status(200).json({
        success: true,
        reportType: 'daily',
        selectedDate,
        count: 0,
        highest: null,
        lowest: null,
        average: null,
        readings: [],
        empty: true,
        message: `No readings recorded for ${selectedDate}.`
      });
    }

    const values = readings.map((r) => r.glucose_value);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const average = Number((sum / count).toFixed(1));

    return res.status(200).json({
      success: true,
      reportType: 'daily',
      selectedDate,
      count,
      highest,
      lowest,
      average,
      readings,
      empty: false
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Month-to-Date Report
 * GET /api/reports/month-to-date?date=YYYY-MM-DD
 */
async function getMonthToDateReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();
    const { startDate, endDate } = getMonthToDateRange(selectedDate);

    // Summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*)::int AS count,
        MAX(glucose_value) AS highest,
        MIN(glucose_value) AS lowest,
        ROUND(AVG(glucose_value)::numeric, 1)::float AS average
      FROM readings
      WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
    `;

    const statsResult = await db.query(statsQuery, [userId, startDate, endDate]);
    const stats = statsResult.rows[0];
    const count = stats.count || 0;

    if (count === 0) {
      return res.status(200).json({
        success: true,
        reportType: 'month-to-date',
        selectedDate,
        startDate,
        endDate,
        count: 0,
        highest: null,
        lowest: null,
        average: null,
        dailyBreakdown: [],
        empty: true,
        message: `No readings recorded from ${startDate} through ${endDate}.`
      });
    }

    // Daily breakdown for visual trend
    const breakdownQuery = `
      SELECT 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS reading_count,
        ROUND(AVG(glucose_value)::numeric, 1)::float AS average,
        MIN(glucose_value) AS lowest,
        MAX(glucose_value) AS highest
      FROM readings
      WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
      GROUP BY reading_date
      ORDER BY reading_date ASC
    `;

    const breakdownResult = await db.query(breakdownQuery, [userId, startDate, endDate]);

    return res.status(200).json({
      success: true,
      reportType: 'month-to-date',
      selectedDate,
      startDate,
      endDate,
      count,
      highest: stats.highest,
      lowest: stats.lowest,
      average: stats.average,
      dailyBreakdown: breakdownResult.rows,
      empty: false
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Monthly (Previous Calendar Month) Report
 * GET /api/reports/monthly?date=YYYY-MM-DD
 */
async function getMonthlyReport(req, res, next) {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayString();
    const range = getPreviousMonthRange(selectedDate);
    const { startDate, endDate, monthName, year, month } = range;

    // Summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*)::int AS count,
        MAX(glucose_value) AS highest,
        MIN(glucose_value) AS lowest,
        ROUND(AVG(glucose_value)::numeric, 1)::float AS average
      FROM readings
      WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
    `;

    const statsResult = await db.query(statsQuery, [userId, startDate, endDate]);
    const stats = statsResult.rows[0];
    const count = stats.count || 0;

    if (count === 0) {
      return res.status(200).json({
        success: true,
        reportType: 'monthly',
        selectedDate,
        targetMonth: {
          year,
          month,
          name: monthName,
          startDate,
          endDate
        },
        count: 0,
        highest: null,
        lowest: null,
        average: null,
        dailyBreakdown: [],
        empty: true,
        message: `No readings recorded for the previous calendar month (${monthName}).`
      });
    }

    // Daily breakdown for visual trend
    const breakdownQuery = `
      SELECT 
        TO_CHAR(reading_date, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS reading_count,
        ROUND(AVG(glucose_value)::numeric, 1)::float AS average,
        MIN(glucose_value) AS lowest,
        MAX(glucose_value) AS highest
      FROM readings
      WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
      GROUP BY reading_date
      ORDER BY reading_date ASC
    `;

    const breakdownResult = await db.query(breakdownQuery, [userId, startDate, endDate]);

    return res.status(200).json({
      success: true,
      reportType: 'monthly',
      selectedDate,
      targetMonth: {
        year,
        month,
        name: monthName,
        startDate,
        endDate
      },
      count,
      highest: stats.highest,
      lowest: stats.lowest,
      average: stats.average,
      dailyBreakdown: breakdownResult.rows,
      empty: false
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport
};

