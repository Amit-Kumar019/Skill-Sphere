const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
            minlength: 6,
            select: false,
        },

        // Authentication
        googleId: {
            type: String,
            default: null,
        },

        refreshToken: {
            type: String,
            default: null,
            select: false,
        },

        role: {
            type: String,
            enum: ["client", "freelancer", "admin"],
            default: "client",
        },

        // Contact
        phone: {
            type: String,
            default: "",
        },

        location: {
            city: String,
            state: String,
            country: String,
            pincode: String,
        },

        // Profile
        avatar: {
            url: {
                type: String,
                default: "",
            },
            public_id: {
                type: String,
                default: "",
            },
        },

        bio: {
            type: String,
            default: "",
            maxlength: 500,
        },

        // Verification
        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationToken: {
            type: String,
            default: null,
            select: false,
        },

        passwordResetToken: {
            type: String,
            default: null,
            select: false,
        },

        passwordResetExpires: {
            type: Date,
            default: null,
            select: false,
        },

        // Account Status
        isBlocked: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // Security
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },

        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);


// These are indexes these helps in the fast retriveals of the data : Jab data bada ho jata hai tab itne bade data me agar kuch search karna ho to isase time kam lagta hai
userSchema.index({ email: 1 });

userSchema.index({ username: 1 });

userSchema.index({ role: 1 });

userSchema.index({ "location.city": 1 });

userSchema.index({ "location.state": 1 });


// Hashing of password : Yeh automatically run hota hai jab user save hota hai database me 
userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
});

// ye function user ke password ko DB me rakhe Password secompare karta hai
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};


// ye function JWT token generate karta hai 
userSchema.methods.generateToken = async function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// ye function Refresh token generate karta hai 
userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
};

// ye function User ko Block or Unblock karne ke kaam aata hai
userSchema.methods.blockUser = async function () {
    this.isBlocked = true;
    await this.save();
};

userSchema.methods.unblockUser = async function () {
    this.isBlocked = false;
    await this.save();
};

module.exports = mongoose.model("User", userSchema);