const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboard');
const authenticate = require('../middleware/authenticate');

// Dashboard routes
router.get('/analytics', authenticate, dashboardController.getDashboardAnalytics);
router.get('/service-center-stats', authenticate, dashboardController.getServiceCenterStats);

module.exports = router;