const FreelancerProfile = require("../models/FreelancerProfile");
const ClientProfile = require("../models/ClientProfile");
const User = require("../models/Users");
const Portfolio = require("../models/Portfolio");
const Verification = require("../models/Verification");
const Availability = require("../models/Availability");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { uploadOnCloudinary } = require("../utils/cloudinary");

// ========================= GET CURRENT USER PROFILE =========================
const getMyProfile = asyncHandler(async (req, res) => {
    const role = req.user.role;
    let profile = null;

    if (role === "freelancer") {
        profile = await FreelancerProfile.findOne({ user: req.user._id }).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");
    } else if (role === "client") {
        profile = await ClientProfile.findOne({ user: req.user._id }).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");
    } else {
        throw new ApiError(400, "Invalid user role.");
    }

    // Return 200 with null if profile is not configured yet
    return res.status(200).json(
        new ApiResponse(200, profile, "Profile fetched successfully.")
    );
});

// ========================= CREATE OR UPDATE PROFILE =========================
const createOrUpdateProfile = asyncHandler(async (req, res) => {
    const role = req.user.role;
    const userId = req.user._id;

    // Optional: Update basic User model fields (phone, bio) if passed
    const { phone, bio } = req.body;
    let userUpdate = {};
    if (phone !== undefined) userUpdate.phone = phone;
    if (bio !== undefined) userUpdate.bio = bio;

    // Handle avatar upload on User model
    if (req.files && req.files.avatar && req.files.avatar[0]) {
        const cloudinaryResponse = await uploadOnCloudinary(req.files.avatar[0].path, "skillsphere/avatars");
        if (cloudinaryResponse) {
            userUpdate.avatar = {
                url: cloudinaryResponse.secure_url,
                public_id: cloudinaryResponse.public_id
            };
        }
    }

    if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(userId, userUpdate);
    }

    let profile = null;

    if (role === "freelancer") {
        const { title, bio: profileBio, skills, experience, hourlyRate, certifications, availability } = req.body;

        if (!title || !profileBio || !hourlyRate) {
            throw new ApiError(400, "Title, Bio, and Hourly Rate are required fields.");
        }

        // Skills parsing (handles comma-separated string or array)
        let parsedSkills = [];
        if (skills) {
            parsedSkills = typeof skills === "string" 
                ? skills.split(",").map(s => s.trim()).filter(Boolean)
                : skills;
        }

        // Certifications parsing (JSON string or array)
        let parsedCertifications = [];
        if (certifications) {
            try {
                parsedCertifications = typeof certifications === "string"
                    ? JSON.parse(certifications)
                    : certifications;
            } catch (err) {
                console.error("Error parsing certifications JSON:", err);
            }
        }

        // Handle resume PDF upload to Cloudinary
        let resumeUrl = "";
        if (req.files && req.files.resume && req.files.resume[0]) {
            const cloudinaryResponse = await uploadOnCloudinary(req.files.resume[0].path, "skillsphere/resumes");
            if (cloudinaryResponse) {
                resumeUrl = cloudinaryResponse.secure_url;
            }
        }

        const profileData = {
            user: userId,
            title,
            bio: profileBio,
            skills: parsedSkills,
            experience: Number(experience) || 0,
            hourlyRate: Number(hourlyRate),
            certifications: parsedCertifications,
            availability: availability || "Available",
        };

        if (resumeUrl) {
            profileData.resume = resumeUrl;
        }

        profile = await FreelancerProfile.findOneAndUpdate(
            { user: userId },
            { $set: profileData },
            { new: true, upsert: true, runValidators: true }
        ).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");

    } else if (role === "client") {
        const { companyName, companyWebsite, companyDescription } = req.body;

        // Handle company logo image upload to Cloudinary
        let logoData = {};
        if (req.files && req.files.companyLogo && req.files.companyLogo[0]) {
            const cloudinaryResponse = await uploadOnCloudinary(req.files.companyLogo[0].path, "skillsphere/logos");
            if (cloudinaryResponse) {
                logoData = {
                    url: cloudinaryResponse.secure_url,
                    public_id: cloudinaryResponse.public_id
                };
            }
        }

        const profileData = {
            user: userId,
            companyName: companyName || "",
            companyWebsite: companyWebsite || "",
            companyDescription: companyDescription || "",
        };

        if (logoData.url) {
            profileData.companyLogo = logoData;
        }

        profile = await ClientProfile.findOneAndUpdate(
            { user: userId },
            { $set: profileData },
            { new: true, upsert: true, runValidators: true }
        ).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");

    } else {
        throw new ApiError(400, "Invalid user role.");
    }

    return res.status(200).json(
        new ApiResponse(200, profile, "Profile saved successfully.")
    );
});

// ========================= GET PUBLIC FREELANCER PROFILE =========================
const getFreelancerProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const profile = await FreelancerProfile.findOne({ user: id }).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");

    if (!profile) {
        throw new ApiError(404, "Freelancer profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, profile, "Freelancer profile fetched successfully.")
    );
});

// ========================= GET PUBLIC CLIENT PROFILE =========================
const getClientProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const profile = await ClientProfile.findOne({ user: id }).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");

    if (!profile) {
        throw new ApiError(404, "Client profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, profile, "Client profile fetched successfully.")
    );
});

// ========================= LIST FREELANCERS DIRECTORY =========================
const getFreelancers = asyncHandler(async (req, res) => {
    const { skill } = req.query;
    let query = {};

    if (skill) {
        query.skills = { $in: [new RegExp(skill, "i")] };
    }

    const freelancers = await FreelancerProfile.find(query).populate("user", "username email firstName lastName phone bio avatar isEmailVerified");

    return res.status(200).json(
        new ApiResponse(200, freelancers, "Freelancers list fetched successfully.")
    );
});

// ========================= ADD PORTFOLIO ITEM =========================
const addPortfolioItem = asyncHandler(async (req, res) => {
    if (req.user.role !== "freelancer") {
        throw new ApiError(403, "Only freelancers can add portfolio items.");
    }

    const { title, description, githubLink, liveDemo, technologies } = req.body;
    if (!title) {
        throw new ApiError(400, "Portfolio title is required.");
    }

    let techIds = [];
    if (technologies) {
        const techArray = typeof technologies === "string" 
            ? technologies.split(",").map(t => t.trim()).filter(Boolean)
            : technologies;
        techIds = techArray;
    }

    // Handle portfolio images
    let uploadedImages = [];
    if (req.files && req.files.images) {
        for (const file of req.files.images) {
            const cloudinaryResponse = await uploadOnCloudinary(file.path, "skillsphere/portfolios");
            if (cloudinaryResponse) {
                uploadedImages.push({
                    url: cloudinaryResponse.secure_url,
                    public_id: cloudinaryResponse.public_id
                });
            }
        }
    }

    const portfolio = await Portfolio.create({
        freelancer: req.user._id,
        title,
        description: description || "",
        technologies: techIds,
        githubLink: githubLink || "",
        liveDemo: liveDemo || "",
        images: uploadedImages
    });

    return res.status(201).json(
        new ApiResponse(201, portfolio, "Portfolio item added successfully.")
    );
});

// ========================= DELETE PORTFOLIO ITEM =========================
const deletePortfolioItem = asyncHandler(async (req, res) => {
    if (req.user.role !== "freelancer") {
        throw new ApiError(403, "Only freelancers can delete portfolio items.");
    }

    const { portfolioId } = req.params;
    const portfolio = await Portfolio.findOne({ _id: portfolioId, freelancer: req.user._id });
    if (!portfolio) {
        throw new ApiError(404, "Portfolio item not found or unauthorized.");
    }

    await Portfolio.findByIdAndDelete(portfolioId);

    return res.status(200).json(
        new ApiResponse(200, null, "Portfolio item deleted successfully.")
    );
});

// ========================= SUBMIT VERIFICATION DOCUMENTS =========================
const submitVerificationDocs = asyncHandler(async (req, res) => {
    if (req.user.role !== "freelancer") {
        throw new ApiError(403, "Only freelancers can submit verification documents.");
    }

    if (!req.files || !req.files.aadhaar || !req.files.pan || !req.files.selfie) {
        throw new ApiError(400, "Aadhaar, PAN card, and Selfie verification files are all required.");
    }

    // Upload files to Cloudinary
    const aadhaarRes = await uploadOnCloudinary(req.files.aadhaar[0].path, "skillsphere/verifications");
    const panRes = await uploadOnCloudinary(req.files.pan[0].path, "skillsphere/verifications");
    const selfieRes = await uploadOnCloudinary(req.files.selfie[0].path, "skillsphere/verifications");

    if (!aadhaarRes || !panRes || !selfieRes) {
        throw new ApiError(500, "Failed to upload one or more verification files. Please try again.");
    }

    // Create or update Verification collection entry
    const verification = await Verification.findOneAndUpdate(
        { freelancer: req.user._id },
        {
            $set: {
                freelancer: req.user._id,
                aadhaar: { url: aadhaarRes.secure_url, public_id: aadhaarRes.public_id },
                pan: { url: panRes.secure_url, public_id: panRes.public_id },
                selfie: { url: selfieRes.secure_url, public_id: selfieRes.public_id },
                status: "Pending",
                remarks: ""
            }
        },
        { new: true, upsert: true }
    );

    // Update FreelancerProfile status
    await FreelancerProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: { verificationStatus: "Pending" } }
    );

    return res.status(200).json(
        new ApiResponse(200, verification, "Verification files uploaded successfully. Pending Admin review.")
    );
});

// ========================= UPDATE AVAILABILITY =========================
const updateAvailability = asyncHandler(async (req, res) => {
    if (req.user.role !== "freelancer") {
        throw new ApiError(403, "Only freelancers can update availability.");
    }

    const { status, availableFrom, startHour, endHour, workingDays } = req.body;

    const availability = await Availability.findOneAndUpdate(
        { freelancer: req.user._id },
        {
            $set: {
                freelancer: req.user._id,
                status: status || "Available",
                availableFrom: availableFrom ? new Date(availableFrom) : null,
                workingHours: {
                    start: startHour || "",
                    end: endHour || ""
                },
                workingDays: workingDays || []
            }
        },
        { new: true, upsert: true }
    );

    return res.status(200).json(
        new ApiResponse(200, availability, "Availability updated successfully.")
    );
});

// ========================= GET PORTFOLIO ITEMS =========================
const getFreelancerPortfolio = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const portfolio = await Portfolio.find({ freelancer: id }).sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, portfolio, "Portfolio fetched successfully.")
    );
});

// ========================= GET AVAILABILITY =========================
const getFreelancerAvailability = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const availability = await Availability.findOne({ freelancer: id });
    return res.status(200).json(
        new ApiResponse(200, availability, "Availability fetched successfully.")
    );
});

module.exports = {
    getMyProfile,
    createOrUpdateProfile,
    getFreelancerProfile,
    getClientProfile,
    getFreelancers,
    addPortfolioItem,
    deletePortfolioItem,
    submitVerificationDocs,
    updateAvailability,
    getFreelancerPortfolio,
    getFreelancerAvailability
};
