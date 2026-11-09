// server/src/routes/readingsRoutes.js
const express = require('express');
const router = express.Router();
const readingsController = require('../controllers/readingsController');
const { readingValidation, readingUpdateValidation } = require('../utils/validators');
const { validateRequest } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

// All reading routes require authentication
router.use(authenticateToken);

router.post('/', readingValidation, validateRequest, readingsController.createReading);
router.get('/', readingsController.getReadings);
router.get('/:id', readingsController.getReadingById);
router.put('/:id', readingUpdateValidation, validateRequest, readingsController.updateReading);
router.delete('/:id', readingsController.deleteReading);

module.exports = router;

