const Notification = require("../models/Notification");

const sendNotification = async (app, { receiver, sender, title, message, type }) => {
    try {
        const notification = await Notification.create({
            receiver,
            sender: sender || null,
            title,
            message,
            type,
            isRead: false
        });

        const io = app.get("io");
        if (io) {
            io.to(`user_${receiver}`).emit("notification", notification);
        }
        return notification;
    } catch (error) {
        console.error("Error creating/sending notification:", error);
    }
};

module.exports = { sendNotification };
