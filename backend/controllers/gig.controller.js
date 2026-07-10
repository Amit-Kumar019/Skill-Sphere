const Gig = require("../models/Gig");
const Proposal = require("../models/Proposal");
const Milestone = require("../models/Milestone");
const Category = require("../models/Category");
const Skill = require("../models/Skill");
const User = require("../models/Users");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const mongoose = require("mongoose");

// ========================= GET CATEGORIES & SKILLS =========================
const getCategoriesAndSkills = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true });
    const skills = await Skill.find({ isActive: true });
    
    return res.status(200).json(
        new ApiResponse(200, { categories, skills }, "Categories and skills fetched successfully.")
    );
});

// ========================= CREATE GIG =========================
const createGig = asyncHandler(async (req, res) => {
    if (req.user.role !== "client") {
        throw new ApiError(403, "Only clients are authorized to post Gigs.");
    }

    const { 
        title, 
        description, 
        category, 
        skillsRequired, 
        minBudget, 
        maxBudget, 
        experienceLevel, 
        duration, 
        deadline,
        milestones 
    } = req.body;

    if (!title || !description || !category || !minBudget || !maxBudget || !experienceLevel || !duration || !deadline) {
        throw new ApiError(400, "All required fields must be supplied.");
    }

    // Verify Category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        throw new ApiError(404, "Invalid Category specified.");
    }

    // Skills Required parsing (handles comma-separated string or array of IDs)
    let skillIds = [];
    if (skillsRequired) {
        const skillsArray = typeof skillsRequired === "string" 
            ? skillsRequired.split(",").map(id => id.trim()).filter(Boolean)
            : skillsRequired;
        
        // Map elements to Mongoose ObjectIds
        skillIds = skillsArray.map(id => new mongoose.Types.ObjectId(id));
    }

    // Handle attachments files upload to Cloudinary
    let uploadedAttachments = [];
    if (req.files && req.files.attachments) {
        for (const file of req.files.attachments) {
            const cloudinaryResponse = await uploadOnCloudinary(file.path, "skillsphere/gigs");
            if (cloudinaryResponse) {
                uploadedAttachments.push({
                    url: cloudinaryResponse.secure_url,
                    public_id: cloudinaryResponse.public_id
                });
            }
        }
    }

    // Create Gig
    const gig = await Gig.create({
        client: req.user._id,
        title,
        description,
        category,
        skillsRequired: skillIds,
        budget: {
            min: Number(minBudget),
            max: Number(maxBudget)
        },
        experienceLevel,
        duration,
        deadline: new Date(deadline),
        attachments: uploadedAttachments
    });

    // Create Milestones if supplied
    let createdMilestones = [];
    if (milestones) {
        let parsedMilestones = [];
        try {
            parsedMilestones = typeof milestones === "string" 
                ? JSON.parse(milestones) 
                : milestones;
        } catch (err) {
            console.error("Error parsing milestones JSON:", err);
        }

        for (const m of parsedMilestones) {
            if (m.title && m.amount) {
                const milestone = await Milestone.create({
                    gig: gig._id,
                    title: m.title,
                    description: m.description || "",
                    amount: Number(m.amount),
                    dueDate: m.dueDate ? new Date(m.dueDate) : new Date(deadline)
                });
                createdMilestones.push(milestone);
            }
        }
    }

    return res.status(201).json(
        new ApiResponse(201, { gig, milestones: createdMilestones }, "Gig created successfully.")
    );
});

// ========================= GET OPEN PUBLIC GIGS =========================
const getGigs = asyncHandler(async (req, res) => {
    const { search, category, experienceLevel, minBudget, maxBudget, skills } = req.query;
    let filter = { status: "Open", visibility: "Public" };

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    if (category) {
        filter.category = category;
    }

    if (experienceLevel) {
        filter.experienceLevel = experienceLevel;
    }

    if (minBudget || maxBudget) {
        filter["budget.min"] = {};
        if (minBudget) filter["budget.min"].$gte = Number(minBudget);
        if (maxBudget) filter["budget.min"].$lte = Number(maxBudget);
    }

    if (skills) {
        const skillsArray = typeof skills === "string" ? skills.split(",") : skills;
        filter.skillsRequired = { $in: skillsArray.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const gigs = await Gig.find(filter)
        .populate("client", "username firstName lastName avatar")
        .populate("category", "name")
        .populate("skillsRequired", "name")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, gigs, "Gigs fetched successfully.")
    );
});

// ========================= GET USER'S OWN GIGS =========================
const getMyGigs = asyncHandler(async (req, res) => {
    const role = req.user.role;
    let gigs = [];

    if (role === "client") {
        gigs = await Gig.find({ client: req.user._id })
            .populate("category", "name")
            .populate("skillsRequired", "name")
            .sort({ createdAt: -1 });
    } else if (role === "freelancer") {
        gigs = await Gig.find({ hiredFreelancer: req.user._id })
            .populate("client", "username firstName lastName avatar")
            .populate("category", "name")
            .populate("skillsRequired", "name")
            .sort({ createdAt: -1 });
    } else {
        throw new ApiError(400, "Invalid user role.");
    }

    return res.status(200).json(
        new ApiResponse(200, gigs, "My gigs fetched successfully.")
    );
});

// ========================= GET GIG DETAILS =========================
const getGigDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const gig = await Gig.findById(id)
        .populate("client", "username firstName lastName avatar email phone")
        .populate("category", "name")
        .populate("skillsRequired", "name")
        .populate("hiredFreelancer", "username firstName lastName email phone avatar");

    if (!gig) {
        throw new ApiError(404, "Gig not found.");
    }

    // Get milestones
    const milestones = await Milestone.find({ gig: gig._id }).sort({ dueDate: 1 });

    // Get proposals (Only visible to the Client who posted the gig, or Admins)
    let proposals = [];
    const isOwner = gig.client._id.toString() === req.user._id.toString();
    
    if (isOwner || req.user.role === "admin") {
        proposals = await Proposal.find({ gig: gig._id })
            .populate("freelancer", "username firstName lastName email phone avatar")
            .sort({ createdAt: -1 });
    } else {
        // If freelancer, check if they have submitted a proposal
        const ownProposal = await Proposal.findOne({ gig: gig._id, freelancer: req.user._id });
        if (ownProposal) {
            proposals = [ownProposal];
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200, 
            { gig, milestones, proposals, isOwner }, 
            "Gig details fetched successfully."
        )
    );
});

// ========================= SUBMIT GIG PROPOSAL =========================
const submitProposal = asyncHandler(async (req, res) => {
    if (req.user.role !== "freelancer") {
        throw new ApiError(403, "Only freelancers are authorized to apply to Gigs.");
    }

    const { id: gigId } = req.params;
    const { coverLetter, bidAmount, estimatedDuration, durationUnit } = req.body;

    if (!coverLetter || !bidAmount || !estimatedDuration) {
        throw new ApiError(400, "Cover letter, bid amount, and duration are required.");
    }

    // Check if Gig exists and is Open
    const gig = await Gig.findById(gigId);
    if (!gig) {
        throw new ApiError(404, "Gig not found.");
    }

    if (gig.status !== "Open") {
        throw new ApiError(400, "This Gig is closed for new proposals.");
    }

    // Check for duplicate application
    const existingProposal = await Proposal.findOne({ gig: gigId, freelancer: req.user._id });
    if (existingProposal) {
        throw new ApiError(400, "You have already submitted a proposal for this gig.");
    }

    // Handle attachments uploads to Cloudinary
    let uploadedAttachments = [];
    if (req.files && req.files.attachments) {
        for (const file of req.files.attachments) {
            const cloudinaryResponse = await uploadOnCloudinary(file.path, "skillsphere/proposals");
            if (cloudinaryResponse) {
                uploadedAttachments.push({
                    url: cloudinaryResponse.secure_url,
                    public_id: cloudinaryResponse.public_id
                });
            }
        }
    }

    // Create Proposal
    const proposal = await Proposal.create({
        gig: gigId,
        freelancer: req.user._id,
        coverLetter,
        bidAmount: Number(bidAmount),
        estimatedDuration: Number(estimatedDuration),
        durationUnit: durationUnit || "Days",
        attachments: uploadedAttachments
    });

    // Increment proposals count on Gig
    gig.proposalsCount += 1;
    await gig.save();

    return res.status(201).json(
        new ApiResponse(201, proposal, "Proposal submitted successfully.")
    );
});

// ========================= GET FREELANCER'S OWN PROPOSALS =========================
const getMyProposals = asyncHandler(async (req, res) => {
    if (req.user.role !== "freelancer") {
        throw new ApiError(403, "Only freelancers can view submitted proposals.");
    }

    const proposals = await Proposal.find({ freelancer: req.user._id })
        .populate({
            path: "gig",
            select: "title budget status deadline client category",
            populate: [
                { path: "client", select: "username firstName lastName avatar" },
                { path: "category", select: "name" }
            ]
        })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, proposals, "My proposals fetched successfully.")
    );
});

// ========================= ACCEPT / REJECT PROPOSAL =========================
const handleProposalStatus = asyncHandler(async (req, res) => {
    const { id: proposalId } = req.params;
    const { status } = req.body; // 'Accepted' or 'Rejected'

    if (!["Accepted", "Rejected"].includes(status)) {
        throw new ApiError(400, "Invalid status choice. Must be Accepted or Rejected.");
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
        throw new ApiError(404, "Proposal not found.");
    }

    const gig = await Gig.findById(proposal.gig);
    if (!gig) {
        throw new ApiError(404, "Associated Gig not found.");
    }

    // Verify ownership
    if (gig.client.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access Denied. You are not the client owner of this gig.");
    }

    if (gig.status !== "Open") {
        throw new ApiError(400, "This gig is no longer open for hiring.");
    }

    if (status === "Accepted") {
        // Accept this proposal
        proposal.status = "Accepted";
        await proposal.save();

        // Update Gig status and hired freelancer
        gig.status = "In Progress";
        gig.hiredFreelancer = proposal.freelancer;
        await gig.save();

        // Reject all other proposals for this gig
        await Proposal.updateMany(
            { gig: gig._id, _id: { $ne: proposal._id }, status: "Pending" },
            { $set: { status: "Rejected" } }
        );

        // Update Milestone statuses to "In Progress"
        await Milestone.updateMany(
            { gig: gig._id },
            { $set: { status: "In Progress" } }
        );
    } else {
        // Reject this proposal
        proposal.status = "Rejected";
        await proposal.save();
    }

    return res.status(200).json(
        new ApiResponse(200, proposal, `Proposal has been successfully ${status.toLowerCase()}.`)
    );
});

module.exports = {
    getCategoriesAndSkills,
    createGig,
    getGigs,
    getMyGigs,
    getGigDetails,
    submitProposal,
    getMyProposals,
    handleProposalStatus
};
