const mongoose = require("mongoose");

const adminLogSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            required: true,
        },

        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

adminLogSchema.index({ admin: 1 });
adminLogSchema.index({ action: 1 });

module.exports = mongoose.model("AdminLog", adminLogSchema);