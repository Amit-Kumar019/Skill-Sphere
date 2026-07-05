const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        message: {
            type: String,
            trim: true,
            default: "",
        },

        attachments: [
            {
                url: String,
                public_id: String,
            },
        ],

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ chat: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);