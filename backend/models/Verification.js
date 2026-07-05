const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
    {
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        aadhaar: {
            url: String,
            public_id: String,
        },

        pan: {
            url: String,
            public_id: String,
        },

        selfie: {
            url: String,
            public_id: String,
        },

        status: {
            type: String,
            enum: ["Pending", "Verified", "Rejected"],
            default: "Pending",
        },

        remarks: {
            type: String,
            default: "",
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

verificationSchema.index({ freelancer: 1 });
verificationSchema.index({ status: 1 });

module.exports = mongoose.model("Verification", verificationSchema);