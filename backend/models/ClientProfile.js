const mongoose = require("mongoose");

const clientProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        companyName: {
            type: String,
            trim: true,
            default: "",
        },

        companyWebsite: {
            type: String,
            default: "",
        },

        companyDescription: {
            type: String,
            maxlength: 1000,
            default: "",
        },

        companyLogo: {
            url: {
                type: String,
                default: "",
            },
            public_id: {
                type: String,
                default: "",
            },
        },

        totalProjectsPosted: {
            type: Number,
            default: 0,
        },

        totalProjectsCompleted: {
            type: Number,
            default: 0,
        },

        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        totalReviews: {
            type: Number,
            default: 0,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);


// indexs

clientProfileSchema.index({ companyName: 1 });

clientProfileSchema.index({ averageRating: -1 });

module.exports = mongoose.model("ClientProfile", clientProfileSchema);