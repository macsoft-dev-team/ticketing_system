const notificationService = require('../service/notification');

const getNotifications = async (req, res) => {
    try {
        console.log(`🔔 API: Getting notifications - req.user:`, req.user);
        
        if (!req.user || !req.user.id) {
            console.error('❌ No user ID in request');
            return res.status(401).json({ 
                success: false,
                message: "User not authenticated properly" 
            });
        }
        
        const userId = req.user.id;
        console.log(`🔔 API: Getting notifications for user ${userId} (${req.user.name}, ${req.user.role})`);
        
        const notifications = await notificationService.getNotifications(userId);
        console.log(`🔔 API: Successfully retrieved ${notifications.length} notifications for user ${req.user.name}`);
        
        // Add detailed logging for debugging
        if (notifications.length === 0) {
            console.log(`⚠️  No notifications found for user ${userId} (${req.user.name}, ${req.user.role})`);
            console.log(`⚠️  This user should receive notifications if they have role: MACSOFT_ADMIN, MACSOFT_HEAD, MACSOFT_SUPPORT, or SERVICE_CENTER_HEAD`);
        }
        
        res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('❌ Error in getNotifications:', error);
        console.error('❌ Error stack:', error.stack);
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
        console.log(`✅ API: Updating notification ${id} for user ${userId}`);
        const notification = await notificationService.updateNotification(parseInt(id), userId, io);
        res.status(200).json({
            success: true,
            data: notification,
            message: "Notification marked as seen"
        });
    } catch (error) {
        console.error('❌ Error in updateNotification:', error);
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
        console.log(`📊 API: Getting notification counts for user ${userId}`);
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

module.exports = {
    getNotifications,
    updateNotification,
    getNotificationCounts,
};