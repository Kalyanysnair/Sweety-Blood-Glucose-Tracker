// server/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const readingsRoutes = require('./readingsRoutes');
const reportsRoutes = require('./reportsRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Sweety Blood Glucose Tracker API',
    timestamp: new Date().toISOString()
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/readings', readingsRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;

