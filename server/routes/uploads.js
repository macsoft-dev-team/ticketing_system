const express = require('express');
const router = express.Router();
const uploadController = require('../controller/uploads');

// Upload routes
router.post('/user', uploadController.uploadUsers); // Match frontend API_ENDPOINTS.upload + '/user'
router.post('/users', uploadController.uploadUsers); // Alternative endpoint
router.post('/organisations', uploadController.uploadOrganisations);
router.post('/service-centers', uploadController.uploadServiceCenters);
router.post('/products', uploadController.uploadProducts);

module.exports = router;
