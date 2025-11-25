const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { prisma } = require('../lib/clients');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/settings/notifications
 * Get current notification preferences for the user or system-wide settings
 */
router.get('/notifications', async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    // Only MACSOFT_ADMIN can access system-wide settings
    if (role !== 'MACSOFT_ADMIN') {
      return res.status(403).json({ 
        message: 'Access denied. Only MACSOFT_ADMIN can access system settings.' 
      });
    }

    // For now, return default system-wide notification settings
    // In a real implementation, you'd store these in a system_settings table
    const defaultSettings = {
      emailNotifications: true,
      pushNotifications: true,
      ticketCreated: true,
      ticketUpdated: true,
      ticketAssigned: true,
      milestoneCompleted: true,
      spareRequestApproval: true,
      systemMaintenance: true,
      weeklyReports: true,
      monthlyReports: false
    };

    res.status(200).json(defaultSettings);
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ 
      message: 'Failed to get notification settings',
      error: error.message 
    });
  }
});

/**
 * PUT /api/settings/notifications
 * Update notification preferences
 */
router.put('/notifications', async (req, res) => {
  try {
    const { userId, role } = req.user;
    const notificationSettings = req.body;
    
    // Only MACSOFT_ADMIN can update system-wide settings
    if (role !== 'MACSOFT_ADMIN') {
      return res.status(403).json({ 
        message: 'Access denied. Only MACSOFT_ADMIN can update system settings.' 
      });
    }

    // Validate the settings structure
    const requiredFields = [
      'emailNotifications', 'pushNotifications', 'ticketCreated', 
      'ticketUpdated', 'ticketAssigned', 'milestoneCompleted',
      'spareRequestApproval', 'systemMaintenance', 'weeklyReports', 'monthlyReports'
    ];

    for (const field of requiredFields) {
      if (typeof notificationSettings[field] !== 'boolean') {
        return res.status(400).json({ 
          message: `Invalid value for ${field}. Expected boolean.` 
        });
      }
    }

    // In a real implementation, you would save these to a database
    // For now, we'll just acknowledge the update
    
     res.status(200).json({
      message: 'Notification settings updated successfully',
      settings: notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ 
      message: 'Failed to update notification settings',
      error: error.message 
    });
  }
});

/**
 * GET /api/settings/system-info
 * Get general system information (for MACSOFT_ADMIN only)
 */
router.get('/system-info', async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'MACSOFT_ADMIN') {
      return res.status(403).json({ 
        message: 'Access denied. Only MACSOFT_ADMIN can access system information.' 
      });
    }

    // Get various system statistics
    const [
      totalUsers,
      totalTickets,
      totalServiceCenters,
      totalOrganisations,
      totalProducts,
      recentTickets
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ticket.count(),
      prisma.serviceCenter.count(),
      prisma.organisation.count(),
      prisma.product.count(),
      prisma.ticket.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    const systemInfo = {
      totalUsers,
      totalTickets,
      totalServiceCenters,
      totalOrganisations,
      totalProducts,
      recentTickets,
      systemVersion: '1.0.0',
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(systemInfo);
  } catch (error) {
    console.error('Error getting system information:', error);
    res.status(500).json({ 
      message: 'Failed to get system information',
      error: error.message 
    });
  }
});

module.exports = router;