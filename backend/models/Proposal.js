const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: true,
        },

        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        coverLetter: {
            type: String,
            required: true,
            maxlength: 2000,
        },

        bidAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        estimatedDuration: {
            type: Number,
            required: true,
        },

        durationUnit: {
            type: String,
            enum: ["Days", "Weeks", "Months"],
            default: "Days",
        },

        attachments: [
            {
                url: String,
                public_id: String,
            },
        ],

        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Rejected",
                "Withdrawn",
            ],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

proposalSchema.index({ gig: 1 });
proposalSchema.index({ freelancer: 1 });
proposalSchema.index({ status: 1 });

module.exports = mongoose.model("Proposal", proposalSchema);