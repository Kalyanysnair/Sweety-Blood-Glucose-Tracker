// server/src/middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  // Log unexpected errors
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error encountered:', err);
  }

  // Handle body-parser JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload provided.'
    });
  }

  // Handle PostgreSQL unique constraint violation (code 23505)
  if (err.code === '23505') {
    if (err.constraint === 'users_email_key' || (err.detail && err.detail.includes('email'))) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered. Please log in or use a different email.'
      });
    }

    if (err.constraint === 'uq_user_reading_slot' || (err.detail && err.detail.includes('reading_date'))) {
      return res.status(409).json({
        success: false,
        message: 'A reading for this time slot on this date already exists.'
      });
    }

    return res.status(409).json({
      success: false,
      message: 'A conflicting record already exists.'
    });
  }

  // Handle PostgreSQL check constraint violation (code 23514)
  if (err.code === '23514') {
    if (err.constraint === 'chk_glucose_value') {
      return res.status(400).json({
        success: false,
        message: 'Glucose value must be a whole number between 40 and 600.'
      });
    }
    if (err.constraint === 'chk_time_slot') {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot specified.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Database check constraint failed.'
    });
  }

  // Handle generic operational / HTTP errors
  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational || statusCode !== 500
    ? err.message
    : 'An unexpected internal server error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

