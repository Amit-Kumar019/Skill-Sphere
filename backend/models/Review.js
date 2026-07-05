const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
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

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        comment: {
            type: String,
            default: "",
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ freelancer: 1 });
reviewSchema.index({ gig: 1 });

module.exports = mongoose.model("Review", reviewSchema);