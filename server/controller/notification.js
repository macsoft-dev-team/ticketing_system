const notificationService = require('../service/notification');

const getNotifications = async (req, res) => {
    try {        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                message: "User not authenticated properly" 
            });
        }
        
        const userId = req.user.id;
        
        // Check if this is a request with filters (for the dedicated notifications page)
        const hasFilters = Object.keys(req.query).length > 0;
        
        if (hasFilters) {
            const filters = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                search: req.query.search || '',
                type: req.query.type || 'all',
                status: req.query.status || 'all',
                dateRange: req.query.dateRange || 'all',
                ticketId: req.query.ticketId || '',
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc'
            };
            
            const result = await notificationService.getNotificationsWithFilters(userId, filters);
            
            res.status(200).json({
                success: true,
                data: result.data,
                totalCount: result.totalCount,
                totalPages: result.totalPages,
                currentPage: result.currentPage,
                hasNextPage: result.hasNextPage,
                hasPreviousPage: result.hasPreviousPage
            });
        } else {
            // Original simple notification fetch for notification bell
            const notifications = await notificationService.getNotifications(userId);
     
            res.status(200).json({
                success: true,
                data: notifications,
                count: notifications.length
            });
        }
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
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const markTicketNotificationsAsSeen = async (req, res) => {
    const { ticketId } = req.params;
    const userId = req.user.id;
    
    try {
        const result = await notificationService.markTicketNotificationsAsSeen(parseInt(ticketId), userId);
        res.status(200).json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const deleteNotification = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
        const result = await notificationService.deleteNotification(parseInt(id), userId);
        res.status(200).json({
            success: true,
            data: result,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const bulkUpdateNotifications = async (req, res) => {
    const { notificationIds, updateData } = req.body;
    const userId = req.user.id;
    
    try {
        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification IDs provided"
            });
        }

        const result = await notificationService.bulkUpdateNotifications(
            notificationIds.map(id => parseInt(id)),
            userId,
            updateData
        );
        
        res.status(200).json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const bulkDeleteNotifications = async (req, res) => {
    const { notificationIds } = req.body;
    const userId = req.user.id;
    
    try {
        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification IDs provided"
            });
        }

        const result = await notificationService.bulkDeleteNotifications(
            notificationIds.map(id => parseInt(id)),
            userId
        );
        
        res.status(200).json({
            success: true,
            data: result,
            message: result.message
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message || "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getNotifications,
    updateNotification,
    deleteNotification,
    bulkUpdateNotifications,
    bulkDeleteNotifications,
    getNotificationCounts,
    markNotificationAsRead,
    markTicketNotificationsAsSeen,
};