// server/src/utils/validators.js
const { body, query, param } = require('express-validator');
const { ALLOWED_TIME_SLOTS, isValidDateString, isDateInFuture } = require('./dateUtils');

const registerValidation = [
  body('name')
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isString()
    .withMessage('Email must be a string')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required')
];

const readingValidation = [
  body('reading_date')
    .notEmpty()
    .withMessage('Reading date is required')
    .custom((value) => {
      if (!isValidDateString(value)) {
        throw new Error('Reading date must be a valid date in YYYY-MM-DD format');
      }
      if (isDateInFuture(value)) {
        throw new Error('Reading date cannot be in the future');
      }
      return true;
    }),
  body('time_slot')
    .notEmpty()
    .withMessage('Time slot is required')
    .isIn(ALLOWED_TIME_SLOTS)
    .withMessage(`Time slot must be one of: ${ALLOWED_TIME_SLOTS.join(', ')}`),
  body('glucose_value')
    .notEmpty()
    .withMessage('Glucose value is required')
    .isInt({ min: 40, max: 600 })
    .withMessage('Glucose value must be a whole number between 40 and 600')
];

const readingUpdateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Reading ID must be a positive integer'),
  body('reading_date')
    .notEmpty()
    .withMessage('Reading date is required')
    .custom((value) => {
      if (!isValidDateString(value)) {
        throw new Error('Reading date must be a valid date in YYYY-MM-DD format');
      }
      if (isDateInFuture(value)) {
        throw new Error('Reading date cannot be in the future');
      }
      return true;
    }),
  body('time_slot')
    .notEmpty()
    .withMessage('Time slot is required')
    .isIn(ALLOWED_TIME_SLOTS)
    .withMessage(`Time slot must be one of: ${ALLOWED_TIME_SLOTS.join(', ')}`),
  body('glucose_value')
    .notEmpty()
    .withMessage('Glucose value is required')
    .isInt({ min: 40, max: 600 })
    .withMessage('Glucose value must be a whole number between 40 and 600')
];

const reportQueryValidation = [
  query('date')
    .optional()
    .custom((value) => {
      if (!isValidDateString(value)) {
        throw new Error('Date parameter must be a valid date in YYYY-MM-DD format');
      }
      return true;
    })
];

module.exports = {
  registerValidation,
  loginValidation,
  readingValidation,
  readingUpdateValidation,
  reportQueryValidation
};
