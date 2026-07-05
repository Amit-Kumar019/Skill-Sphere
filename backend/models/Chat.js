const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            default: null,
        },

        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ gig: 1 });

module.exports = mongoose.model("Chat", chatSchema);