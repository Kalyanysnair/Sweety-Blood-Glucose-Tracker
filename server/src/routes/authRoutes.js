// server/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../utils/validators');
const { validateRequest } = require('../middleware/validator');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

