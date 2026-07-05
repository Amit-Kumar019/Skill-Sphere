const mongoose = require("mongoose");

const gigSchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        skillsRequired: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],

        budget: {
            min: {
                type: Number,
                required: true,
            },
            max: {
                type: Number,
                required: true,
            },
        },

        experienceLevel: {
            type: String,
            enum: ["Beginner", "Intermediate", "Expert"],
            required: true,
        },

        duration: {
            type: String,
            required: true,
        },

        deadline: {
            type: Date,
            required: true,
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
                "Open",
                "In Progress",
                "Completed",
                "Cancelled",
                "Closed",
            ],
            default: "Open",
        },

        visibility: {
            type: String,
            enum: ["Public", "Private"],
            default: "Public",
        },

        proposalsCount: {
            type: Number,
            default: 0,
        },

        hiredFreelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

gigSchema.index({ client: 1 });
gigSchema.index({ category: 1 });
gigSchema.index({ skillsRequired: 1 });
gigSchema.index({ status: 1 });
gigSchema.index({ deadline: 1 });

module.exports = mongoose.model("Gig", gigSchema);