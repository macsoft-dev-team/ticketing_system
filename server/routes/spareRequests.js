const express = require('express');
const router = express.Router();
const spareRequestController = require('../controller/spareRequests');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
// Create a new spare request
router.post('/', authenticate, spareRequestController.createSpareRequest);

// Get all spare requests (with optional filters)
router.get('/', authenticate, spareRequestController.getAllSpareRequests);

// Get spare requests by ticket code
router.get('/ticket/:ticketCode', authenticate, spareRequestController.getSpareRequestsByTicket);

// Update spare request status
router.put('/:id/status', authenticate, spareRequestController.updateSpareRequestStatus);

// Update spare request item status
router.put('/items/:itemId/status', authenticate, spareRequestController.updateSpareRequestItemStatus);

// Bulk approve spare requests for a ticket
router.put('/ticket/:ticketCode/bulk-approve', authenticate, spareRequestController.bulkApproveSpareRequestsByTicket);

// Get pending spare requests for approval (admin view)
router.get('/pending-approval', authenticate, spareRequestController.getPendingSpareRequestsForApproval);

// Approve individual spare request item
router.post('/:id/approve', authenticate, spareRequestController.approveSpareRequestItem);

// Reject individual spare request item
router.post('/:id/reject', authenticate, spareRequestController.rejectSpareRequestItem);

// Bulk approve multiple spare request items
router.post('/bulk-approve', authenticate, spareRequestController.bulkApproveSpareRequestItems);

module.exports = router;
