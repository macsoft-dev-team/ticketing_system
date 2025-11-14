const express = require('express');
const router = express.Router();
const ticketCodeController = require('../controller/ticketCodeConfig');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/ticket-code/stats
 * Get ticket statistics for a specific year
 * Query params: ?year=2025
 */
router.get('/stats', ticketCodeController.getTicketStatistics);

/**
 * GET /api/ticket-code/next-preview
 * Get preview of next ticket code
 * Query params: ?prefix=TKT&suffix=URGENT
 */
router.get('/next-preview', ticketCodeController.getNextTicketPreview);

/**
 * PUT /api/ticket-code/prefix
 * Update ticket code prefix
 * Body: { prefix: "TKT", year: 2025 }
 */
router.put('/prefix', ticketCodeController.updatePrefix);

/**
 * POST /api/ticket-code/sample
 * Generate a sample ticket code (WARNING: This increments the actual sequence)
 * Body: { prefix: "TKT", suffix: "URGENT" }
 */
router.post('/sample', ticketCodeController.generateSampleCode);

module.exports = router;