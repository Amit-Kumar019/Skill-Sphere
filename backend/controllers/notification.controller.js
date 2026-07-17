const Notification = require("../models/Notification");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");

// ========================= GET MY NOTIFICATIONS =========================
const getMyNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const notifications = await Notification.find({ receiver: userId })
        .populate("sender", "username firstName lastName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, notifications, "Notifications fetched successfully.")
    );
});

// ========================= MARK NOTIFICATION AS READ =========================
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, receiver: userId });
    if (!notification) {
        throw new ApiError(404, "Notification not found.");
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read successfully.")
    );
});

// ========================= MARK ALL AS READ =========================
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany(
        { receiver: userId, isRead: false },
        { $set: { isRead: true } }
    );

    return res.status(200).json(
        new ApiResponse(200, null, "All notifications marked as read.")
    );
});

// ========================= DELETE NOTIFICATION =========================
const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, receiver: userId });
    if (!notification) {
        throw new ApiError(404, "Notification not found.");
    }

    await Notification.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, null, "Notification deleted successfully.")
    );
});

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
