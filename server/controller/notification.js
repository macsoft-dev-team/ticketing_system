const notificationService = require('../service/notification');

const getNotifications = async (req, res) => {
    try {        
        if (!req.user || !req.user.id) {
            console.error('❌ No user ID in request');
            return res.status(401).json({ 
                success: false,
                message: "User not authenticated properly" 
            });
        }
        
        const userId = req.user.id;        
        const notifications = await notificationService.getNotifications(userId);
 
        res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
         res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

const updateNotification = async (req, res) => {
    const { id } = req.params;
    const io = req.io;
    const userId = req.user.id;
    try {
         const notification = await notificationService.updateNotification(parseInt(id), userId, io);
        res.status(200).json({
            success: true,
            data: notification,
            message: "Notification marked as seen"
        });
    } catch (error) {
         res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const getNotificationCounts = async (req, res) => {
    const userId = req.user.id;
    try {
         const counts = await notificationService.getNotificationCounts(userId);
        res.status(200).json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('❌ Error in getNotificationCounts:', error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const notification = await notificationService.markNotificationAsRead(parseInt(id), userId);
        res.status(200).json({
            success: true,
            data: notification,
            message: "Notification marked as read"
        });
    } catch (error) {
        console.error('❌ Error in markNotificationAsRead:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

module.exports = {
    getNotifications,
    updateNotification,
    getNotificationCounts,
    markNotificationAsRead,
};