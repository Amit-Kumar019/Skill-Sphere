const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
    {
        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        status: {
            type: String,
            enum: ["Available", "Busy", "Unavailable"],
            default: "Available",
        },

        availableFrom: {
            type: Date,
            default: null,
        },

        workingHours: {
            start: {
                type: String,
                default: "",
            },
            end: {
                type: String,
                default: "",
            },
        },

        workingDays: [
            {
                type: String,
                enum: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                ],
            },
        ],
    },
    {
        timestamps: true,
    }
);

availabilitySchema.index({ freelancer: 1 });
availabilitySchema.index({ status: 1 });

module.exports = mongoose.model("Availability", availabilitySchema);