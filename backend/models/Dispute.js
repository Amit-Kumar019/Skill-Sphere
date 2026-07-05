const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
    {
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
        },

        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: true,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        reason: {
            type: String,
            required: true,
        },

        evidence: [
            {
                url: String,
                public_id: String,
            },
        ],

        status: {
            type: String,
            enum: ["Open", "Under Review", "Resolved", "Rejected"],
            default: "Open",
        },

        resolution: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

disputeSchema.index({ payment: 1 });
disputeSchema.index({ status: 1 });

module.exports = mongoose.model("Dispute", disputeSchema);