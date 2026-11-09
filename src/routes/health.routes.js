const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');

/**
 * GET /api/v1/health
 * Verifies that the Express API is running.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

/**
 * GET /api/v1/health/db
 * Checks the connection to PostgreSQL.
 * Returns 200 if connected, or 503 if unavailable (without crashing the server).
 */
router.get('/db', async (req, res) => {
  const dbStatus = await testConnection();

  if (dbStatus.connected) {
    return res.status(200).json({
      status: 'ok',
    });
  }

  return res.status(503).json({
    status: 'unavailable',
    message: 'This service is temporarily unavailable. Please try again later.',
  });
});

module.exports = router;
