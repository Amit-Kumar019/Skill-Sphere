const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        title: {
            type: String,
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            enum: [
                "Message",
                "Proposal",
                "Payment",
                "Review",
                "System",
            ],
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ receiver: 1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);