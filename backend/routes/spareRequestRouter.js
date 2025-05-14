const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authmiddleware');
const multer = require("multer");

const spareRequestController = require('../controllers/spareRequestController');

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/spare-requests', verifyToken, upload.array('photos'), spareRequestController.createSpareRequest);
router.get('/spare-requests/:id/photos', verifyToken, spareRequestController.getSpareRequestPhotos);
router.get('/spare-requests/user', verifyToken, spareRequestController.getSpareRequests);
router.put('/spare-requests/close/:id', verifyToken, spareRequestController.closeSpareRequest);
router.put('/spare-requests/:id', verifyToken, upload.array('photos'), spareRequestController.updateSpareRequest); // Add multer middleware
router.delete('/spare-requests/:id', verifyToken, spareRequestController.deleteSpareRequest);

module.exports = router;