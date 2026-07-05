const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        description: {
            type: String,
            default: "",
        },

        popularity: {
            type: Number,
            default: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

skillSchema.index({ name: 1 });
skillSchema.index({ category: 1 });

module.exports = mongoose.model("Skill", skillSchema);