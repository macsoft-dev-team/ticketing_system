const express = require('express');
const router = express.Router();
const milestones = require('../controller/milestones');
const authenticate = require('../middleware/authenticate');

// Routes
router.get('/:ticketId', authenticate, milestones.getTicketMilestones);
router.post("/:ticketId", authenticate, milestones.createMilestone);
router.get('/ticket/:ticketId', authenticate, milestones.getTicketMilestones);
router.get('/ticket/:ticketId', authenticate, milestones.getTicketMilestones);
router.get('/ticket/:ticketId/current', authenticate, milestones.getCurrentMilestone);
router.get('/ticket/:ticketId/available-transitions', authenticate, milestones.getAvailableTransitions);
router.post('/ticket/:ticketId/transition', authenticate, milestones.handleMilestoneFileUpload, milestones.transitionMilestone);
router.post('/ticket/:ticketId/add-photos', authenticate, milestones.handleMilestoneFileUpload, milestones.addPhotosToCurrentMilestone);

router.put('/:milestoneId/notes', authenticate, milestones.updateMilestoneNotes);
router.put('/:milestoneId', authenticate, milestones.updateMilestone);

module.exports = router;
