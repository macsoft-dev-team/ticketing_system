const express = require('express');
const router = express.Router();
const jobScheduler = require('../jobs/scheduler');
const { getCandidateTicketsForClosure } = require('../jobs/autoCloseTickets');
const { getCandidateTicketsForBuzzer } = require('../jobs/buzzerAlerts');

/**
 * Get job scheduler status
 */
router.get('/status', async (req, res) => {
  try {
    const status = jobScheduler.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

/**
 * Start job scheduler
 */
router.post('/start', async (req, res) => {
  try {
    jobScheduler.start();
    res.json({
      success: true,
      message: 'Job scheduler started successfully'
    });
  } catch (error) {
    console.error('Error starting job scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start job scheduler',
      error: error.message
    });
  }
});

/**
 * Stop job scheduler
 */
router.post('/stop', async (req, res) => {
  try {
    jobScheduler.stop();
    res.json({
      success: true,
      message: 'Job scheduler stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping job scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop job scheduler',
      error: error.message
    });
  }
});

/**
 * Run auto-close job manually
 */
router.post('/run-auto-close', async (req, res) => {
  try {
    const result = await jobScheduler.runAutoCloseNow();
    res.json({
      success: true,
      message: 'Auto-close job completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error running auto-close job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run auto-close job',
      error: error.message
    });
  }
});

/**
 * Run buzzer alerts job manually
 */
router.post('/run-buzzer-alerts', async (req, res) => {
  try {
    const result = await jobScheduler.runBuzzerAlertsNow(req.io);
    res.json({
      success: true,
      message: 'Buzzer alerts job completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error running buzzer alerts job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run buzzer alerts job',
      error: error.message
    });
  }
});

/**
 * Get tickets that are candidates for auto-closure
 */
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await getCandidateTicketsForClosure();
    
    const formattedCandidates = candidates.map(ticket => ({
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      description: ticket.description,
      status: ticket.status,
      lastMessage: ticket.messages[0] ? {
        content: ticket.messages[0].content.substring(0, 100) + (ticket.messages[0].content.length > 100 ? '...' : ''),
        createdAt: ticket.messages[0].createdAt,
        sender: {
          name: ticket.messages[0].sender.name,
          role: ticket.messages[0].sender.role
        }
      } : null,
      messageCount: ticket.messages.length
    }));
    
    res.json({
      success: true,
      data: {
        count: formattedCandidates.length,
        tickets: formattedCandidates
      }
    });
  } catch (error) {
    console.error('Error getting candidate tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get candidate tickets',
      error: error.message
    });
  }
});

/**
 * Get tickets that are candidates for buzzer alerts
 */
router.get('/buzzer-candidates', async (req, res) => {
  try {
    const candidates = await getCandidateTicketsForBuzzer();
    
    const formattedCandidates = candidates.map(ticket => ({
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      description: ticket.description,
      customerName: ticket.customerName,
      status: ticket.status,
      lastMessage: ticket.messages[0] ? {
        content: ticket.messages[0].content.substring(0, 100) + (ticket.messages[0].content.length > 100 ? '...' : ''),
        createdAt: ticket.messages[0].createdAt,
        sender: {
          name: ticket.messages[0].sender.name,
          role: ticket.messages[0].sender.role
        },
        hoursSinceMessage: Math.round((new Date() - new Date(ticket.messages[0].createdAt)) / (1000 * 60 * 60))
      } : null,
      messageCount: ticket.messages.length
    }));
    
    res.json({
      success: true,
      data: {
        count: formattedCandidates.length,
        tickets: formattedCandidates
      }
    });
  } catch (error) {
    console.error('Error getting buzzer candidate tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get buzzer candidate tickets',
      error: error.message
    });
  }
});

module.exports = router;