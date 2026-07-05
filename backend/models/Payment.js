const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        gig: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
            required: true,
        },

        milestone: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Milestone",
            default: null,
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

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            enum: ["Razorpay", "Stripe"],
            required: true,
        },

        transactionId: {
            type: String,
            required: true,
            unique: true,
        },

        status: {
            type: String,
            enum: ["Pending", "Completed", "Failed", "Refunded"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ gig: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ freelancer: 1 });

module.exports = mongoose.model("Payment", paymentSchema);