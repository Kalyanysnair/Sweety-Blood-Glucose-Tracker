// server/src/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { reportQueryValidation } = require('../utils/validators');
const { validateRequest } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// All report routes require authentication
router.use(authenticateToken);

router.get('/daily', reportQueryValidation, validateRequest, reportsController.getDailyReport);
router.get('/month-to-date', reportQueryValidation, validateRequest, reportsController.getMonthToDateReport);
router.get('/monthly', reportQueryValidation, validateRequest, reportsController.getMonthlyReport);

module.exports = router;

