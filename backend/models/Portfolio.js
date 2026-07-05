const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
    {
        freelancer: {
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
            default: "",
        },

        technologies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skill",
            },
        ],

        githubLink: {
            type: String,
            default: "",
        },

        liveDemo: {
            type: String,
            default: "",
        },

        images: [
            {
                url: String,
                public_id: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

portfolioSchema.index({ freelancer: 1 });

module.exports = mongoose.model("Portfolio", portfolioSchema);