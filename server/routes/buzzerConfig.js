const express = require('express');
const router = express.Router();
const {
  getBuzzerConfig,
  updateBuzzerConfig,
  getBuzzerConfigHistory
} = require('../controller/buzzerConfigController');

/**
 * @route   GET /api/buzzer-config
 * @desc    Get current active buzzer alert configuration
 * @access  Private (MACSOFT_ADMIN, MACSOFT_HEAD)
 */
router.get('/', getBuzzerConfig);

/**
 * @route   PUT /api/buzzer-config
 * @desc    Update buzzer alert configuration
 * @access  Private (MACSOFT_ADMIN, MACSOFT_HEAD)
 */
router.put('/', updateBuzzerConfig);

/**
 * @route   GET /api/buzzer-config/history
 * @desc    Get all buzzer alert configuration history
 * @access  Private (MACSOFT_ADMIN, MACSOFT_HEAD)
 */
router.get('/history', getBuzzerConfigHistory);

module.exports = router;
