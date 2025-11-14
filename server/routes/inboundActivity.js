const express = require('express');
const router = express.Router();
const inboundActivityController = require('../controller/inboundActivity');
const authenticate = require('../middleware/authenticate');

// All routes require authentication

// Get inbound activity history
router.get('/', inboundActivityController.getInboundActivityHistory);

// Get inbound activity summary
router.get('/summary', inboundActivityController.getInboundActivitySummary);

// Create inbound activity
router.post('/', inboundActivityController.createInboundActivity);

// Process bulk inbound activity
router.post('/bulk', inboundActivityController.processBulkInboundActivity);

module.exports = router;