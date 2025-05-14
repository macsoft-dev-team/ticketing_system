const notificationService = require('../service/notification');

const getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const notifications = await notificationService.getNotifications(userId);
        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const updateNotification = async (req, res) => {
    const { id } = req.params;
    const io = req.io;
    const userId = req.user.id;
    try {
        const notification = await notificationService.updateNotification(parseInt(id), userId,io);
        res.status(200).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    getNotifications,
    updateNotification,
};