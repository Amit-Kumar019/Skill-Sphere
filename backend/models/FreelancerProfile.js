const mongoose = require("mongoose");

const freelancerProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        bio: {
            type: String,
            required: true,
            maxlength: 1000,
        },

        skills: [
            {
                type: String,
                trim: true,
            },
        ],

        experience: {
            type: Number,
            default: 0,
            min: 0,
        },

        hourlyRate: {
            type: Number,
            required: true,
            min: 0,
        },

        portfolio: [
            {
                title: String,
                url: String,
                description: String,
            },
        ],

        resume: {
            type: String,
            default: "",
        },

        certifications: [
            {
                name: String,
                issuer: String,
                year: Number,
            },
        ],

        availability: {
            type: String,
            enum: ["Available", "Busy", "Unavailable"],
            default: "Available",
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        totalReviews: {
            type: Number,
            default: 0,
        },

        completedProjects: {
            type: Number,
            default: 0,
        },

        verificationStatus: {
            type: String,
            enum: ["Pending", "Verified", "Rejected"],
            default: "Pending",
        },

        reputationScore: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);



// Indexes : For fast Serches in DB.
freelancerProfileSchema.index({ user: 1 });

freelancerProfileSchema.index({ skills: 1 });

freelancerProfileSchema.index({ rating: -1 });

freelancerProfileSchema.index({ hourlyRate: 1 });

freelancerProfileSchema.index({ verificationStatus: 1 });


module.exports = mongoose.model("FreelancerProfile", freelancerProfileSchema);