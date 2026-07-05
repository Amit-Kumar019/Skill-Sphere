const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        dueDate: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "In Progress",
                "Submitted",
                "Approved",
                "Rejected",
            ],
            default: "Pending",
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Refunded"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

milestoneSchema.index({ gig: 1 });
milestoneSchema.index({ status: 1 });

module.exports = mongoose.model("Milestone", milestoneSchema);