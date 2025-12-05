const express = require('express');
const { prisma } = require('../lib/clients');
const router = express.Router();

/**
 * Get all working hours configuration
 */
router.get('/working-hours', async (req, res) => {
  try {
    const workingHours = await prisma.workingHours.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });

    const formattedHours = workingHours.map(wh => ({
      ...wh,
      dayName: getDayName(wh.dayOfWeek === 7 ? 0 : wh.dayOfWeek) // Convert back to JS format for display
    }));

    res.json({
      success: true,
      data: formattedHours
    });
  } catch (error) {
    console.error('Error fetching working hours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch working hours',
      error: error.message
    });
  }
});

/**
 * Update working hours for a specific day
 */
router.put('/working-hours/:dayOfWeek', async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { startHour, endHour, isActive } = req.body;

    const updated = await prisma.workingHours.update({
      where: { dayOfWeek: parseInt(dayOfWeek) },
      data: {
        startHour: parseInt(startHour),
        endHour: parseInt(endHour),
        isActive: Boolean(isActive)
      }
    });

    res.json({
      success: true,
      message: 'Working hours updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating working hours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update working hours',
      error: error.message
    });
  }
});

/**
 * Get all break times
 */
router.get('/break-times', async (req, res) => {
  try {
    const breakTimes = await prisma.breakTime.findMany({
      orderBy: { startHour: 'asc' }
    });

    res.json({
      success: true,
      data: breakTimes
    });
  } catch (error) {
    console.error('Error fetching break times:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch break times',
      error: error.message
    });
  }
});

/**
 * Update break time
 */
router.put('/break-times/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startHour, startMinute, endHour, endMinute, isActive } = req.body;

    const updated = await prisma.breakTime.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startHour: parseInt(startHour),
        startMinute: parseInt(startMinute),
        endHour: parseInt(endHour),
        endMinute: parseInt(endMinute),
        isActive: Boolean(isActive)
      }
    });

    res.json({
      success: true,
      message: 'Break time updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating break time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update break time',
      error: error.message
    });
  }
});

/**
 * Get all office holidays
 */
router.get('/holidays', async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const holidays = await prisma.officeHoliday.findMany({
      where: {
        date: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json({
      success: true,
      data: holidays
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch holidays',
      error: error.message
    });
  }
});

/**
 * Add new office holiday
 */
router.post('/holidays', async (req, res) => {
  try {
    const { name, date, description } = req.body;

    const holiday = await prisma.officeHoliday.create({
      data: {
        name,
        date: new Date(date),
        description,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Holiday added successfully',
      data: holiday
    });
  } catch (error) {
    console.error('Error adding holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add holiday',
      error: error.message
    });
  }
});

/**
 * Update office holiday
 */
router.put('/holidays/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, description, isActive } = req.body;

    const updated = await prisma.officeHoliday.update({
      where: { id: parseInt(id) },
      data: {
        name,
        date: new Date(date),
        description,
        isActive: Boolean(isActive)
      }
    });

    res.json({
      success: true,
      message: 'Holiday updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update holiday',
      error: error.message
    });
  }
});

/**
 * Delete office holiday
 */
router.delete('/holidays/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.officeHoliday.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete holiday',
      error: error.message
    });
  }
});

/**
 * Get current working hours status
 */
router.get('/status', async (req, res) => {
  try {
    const { isWithinWorkingHours } = require('../jobs/buzzerAlerts');
    const isWorking = await isWithinWorkingHours();
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    res.json({
      success: true,
      data: {
        isWithinWorkingHours: isWorking,
        currentTime: now.toISOString(),
        localTime: now.toLocaleString(),
        dayOfWeek: getDayName(dayOfWeek),
        hour,
        minutes
      }
    });
  } catch (error) {
    console.error('Error checking working hours status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check working hours status',
      error: error.message
    });
  }
});

/**
 * Helper function to get day name
 */
const getDayName = (dayOfWeek) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
};

module.exports = router;