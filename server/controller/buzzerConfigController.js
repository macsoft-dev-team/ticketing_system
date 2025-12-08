const { prisma } = require("../lib/clients");

/**
 * Get current buzzer alert configuration
 * GET /api/buzzer-config
 */
const getBuzzerConfig = async (req, res) => {
  try {
    // Check if user has admin access
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const config = await prisma.buzzerAlertConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No buzzer alert configuration found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('Error fetching buzzer config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch buzzer alert configuration',
      error: error.message
    });
  }
};

/**
 * Update buzzer alert configuration
 * PUT /api/buzzer-config
 * Body: { minHoursBeforeAlert: number, maxHoursBeforeAlert: number, isActive: boolean }
 */
const updateBuzzerConfig = async (req, res) => {
  try {
    // Check if user has admin access
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { minHours, minMinutes, minSeconds, maxHours, maxMinutes, maxSeconds, isActive, description } = req.body;
    
    // Validation
    if (minHours !== undefined && (minHours < 0 || minHours > 48)) {
      return res.status(400).json({
        success: false,
        message: 'minHours must be between 0 and 48'
      });
    }
    
    if (minMinutes !== undefined && (minMinutes < 0 || minMinutes > 59)) {
      return res.status(400).json({
        success: false,
        message: 'minMinutes must be between 0 and 59'
      });
    }
    
    if (minSeconds !== undefined && (minSeconds < 0 || minSeconds > 59)) {
      return res.status(400).json({
        success: false,
        message: 'minSeconds must be between 0 and 59'
      });
    }
    
    if (maxHours !== undefined && (maxHours < 0 || maxHours > 48)) {
      return res.status(400).json({
        success: false,
        message: 'maxHours must be between 0 and 48'
      });
    }
    
    if (maxMinutes !== undefined && (maxMinutes < 0 || maxMinutes > 59)) {
      return res.status(400).json({
        success: false,
        message: 'maxMinutes must be between 0 and 59'
      });
    }
    
    if (maxSeconds !== undefined && (maxSeconds < 0 || maxSeconds > 59)) {
      return res.status(400).json({
        success: false,
        message: 'maxSeconds must be between 0 and 59'
      });
    }
    
    // Calculate total seconds for comparison
    const minTotalSeconds = (minHours || 0) * 3600 + (minMinutes || 0) * 60 + (minSeconds || 0);
    const maxTotalSeconds = (maxHours || 0) * 3600 + (maxMinutes || 0) * 60 + (maxSeconds || 0);
    
    if (minTotalSeconds > 0 && maxTotalSeconds > 0 && minTotalSeconds >= maxTotalSeconds) {
      return res.status(400).json({
        success: false,
        message: 'Minimum time must be less than maximum time'
      });
    }
    
    if (minTotalSeconds === 0 && (minHours !== undefined || minMinutes !== undefined || minSeconds !== undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Minimum time must be at least 1 second'
      });
    }
    
    // Get current config
    let config = await prisma.buzzerAlertConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!config) {
      // Create new config if none exists
      config = await prisma.buzzerAlertConfig.create({
        data: {
          minHours: minHours !== undefined ? minHours : 3,
          minMinutes: minMinutes !== undefined ? minMinutes : 0,
          minSeconds: minSeconds !== undefined ? minSeconds : 0,
          maxHours: maxHours !== undefined ? maxHours : 5,
          maxMinutes: maxMinutes !== undefined ? maxMinutes : 0,
          maxSeconds: maxSeconds !== undefined ? maxSeconds : 0,
          isActive: isActive !== undefined ? isActive : true,
          description: description || 'Buzzer alert configuration'
        }
      });
    } else {
      // Update existing config
      const updateData = {};
      if (minHours !== undefined) updateData.minHours = minHours;
      if (minMinutes !== undefined) updateData.minMinutes = minMinutes;
      if (minSeconds !== undefined) updateData.minSeconds = minSeconds;
      if (maxHours !== undefined) updateData.maxHours = maxHours;
      if (maxMinutes !== undefined) updateData.maxMinutes = maxMinutes;
      if (maxSeconds !== undefined) updateData.maxSeconds = maxSeconds;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (description !== undefined) updateData.description = description;
      
      config = await prisma.buzzerAlertConfig.update({
        where: { id: config.id },
        data: updateData
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Buzzer alert configuration updated successfully',
      data: config
    });
    
  } catch (error) {
    console.error('Error updating buzzer config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update buzzer alert configuration',
      error: error.message
    });
  }
};

/**
 * Get all buzzer alert configurations (history)
 * GET /api/buzzer-config/history
 */
const getBuzzerConfigHistory = async (req, res) => {
  try {
    // Check if user has admin access
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const configs = await prisma.buzzerAlertConfig.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    
    return res.status(200).json({
      success: true,
      data: configs
    });
    
  } catch (error) {
    console.error('Error fetching buzzer config history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch buzzer alert configuration history',
      error: error.message
    });
  }
};

module.exports = {
  getBuzzerConfig,
  updateBuzzerConfig,
  getBuzzerConfigHistory
};
