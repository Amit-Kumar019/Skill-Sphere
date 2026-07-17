const User = require("../models/Users");
const Verification = require("../models/Verification");
const FreelancerProfile = require("../models/FreelancerProfile");
const Dispute = require("../models/Dispute");
const AdminLog = require("../models/AdminLog");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");

// Middleware helper to check if user is admin
const verifyAdminRole = (req) => {
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Access Denied. Only platform administrators can perform this action.");
    }
};

// ========================= GET PENDING VERIFICATIONS =========================
const getPendingVerifications = asyncHandler(async (req, res) => {
    verifyAdminRole(req);

    const pending = await Verification.find({ status: "Pending" })
        .populate("freelancer", "username email firstName lastName avatar");

    return res.status(200).json(
        new ApiResponse(200, pending, "Pending freelancer verifications fetched successfully.")
    );
});

// ========================= APPROVE / REJECT VERIFICATION =========================
const verifyFreelancerDocs = asyncHandler(async (req, res) => {
    verifyAdminRole(req);

    const { verificationId } = req.params;
    const { status, remarks } = req.body; // status: 'Verified' or 'Rejected'

    if (!["Verified", "Rejected"].includes(status)) {
        throw new ApiError(400, "Invalid status choice. Must be Verified or Rejected.");
    }

    const verification = await Verification.findById(verificationId);
    if (!verification) {
        throw new ApiError(404, "Verification record not found.");
    }

    verification.status = status;
    verification.remarks = remarks || "";
    verification.verifiedBy = req.user._id;
    await verification.save();

    // Update FreelancerProfile status
    await FreelancerProfile.findOneAndUpdate(
        { user: verification.freelancer },
        { $set: { verificationStatus: status } }
    );

    // Log the admin action
    await AdminLog.create({
        admin: req.user._id,
        action: `VERIFICATION_${status.toUpperCase()}`,
        targetUser: verification.freelancer,
        description: `Freelancer KYC verification was ${status.toLowerCase()}. Remarks: ${remarks || "None"}`
    });

    return res.status(200).json(
        new ApiResponse(200, verification, `KYC status successfully updated to ${status.toLowerCase()}.`)
    );
});

// ========================= GET PLATFORM USERS =========================
const getUsersList = asyncHandler(async (req, res) => {
    verifyAdminRole(req);

    const users = await User.find({ role: { $ne: "admin" } })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, users, "Platform users list fetched successfully.")
    );
});

// ========================= BLOCK / UNBLOCK USER =========================
const blockOrUnblockUser = asyncHandler(async (req, res) => {
    verifyAdminRole(req);

    const { userId } = req.params;
    const { block } = req.body; // boolean true/false

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        throw new ApiError(404, "User not found.");
    }

    userToUpdate.isBlocked = !!block;
    await userToUpdate.save();

    // Log the admin action
    await AdminLog.create({
        admin: req.user._id,
        action: block ? "BLOCK_USER" : "UNBLOCK_USER",
        targetUser: userId,
        description: `User account was ${block ? "blocked" : "unblocked"} by admin.`
    });

    return res.status(200).json(
        new ApiResponse(200, userToUpdate, `User has been successfully ${block ? "blocked" : "unblocked"}.`)
    );
});

// ========================= GET DISPUTES =========================
const getDisputes = asyncHandler(async (req, res) => {
    verifyAdminRole(req);

    const disputes = await Dispute.find()
        .populate("gig", "title budget")
        .populate("payment", "amount transactionId")
        .populate("client", "username firstName lastName")
        .populate("freelancer", "username firstName lastName")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, disputes, "Disputes list fetched successfully.")
    );
});

// ========================= RESOLVE DISPUTE =========================
const resolveDispute = asyncHandler(async (req, res) => {
    verifyAdminRole(req);

    const { disputeId } = req.params;
    const { status, resolution } = req.body; // status: 'Resolved' or 'Rejected'

    if (!["Resolved", "Rejected"].includes(status)) {
        throw new ApiError(400, "Invalid status choice. Must be Resolved or Rejected.");
    }

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
        throw new ApiError(404, "Dispute not found.");
    }

    dispute.status = status === "Resolved" ? "Resolved" : "Rejected";
    dispute.resolution = resolution || "";
    await dispute.save();

    // Log the admin action
    await AdminLog.create({
        admin: req.user._id,
        action: `DISPUTE_${status.toUpperCase()}`,
        targetUser: dispute.freelancer,
        description: `Dispute Resolution status set to ${status.toLowerCase()}. Details: ${resolution || "None"}`
    });

    return res.status(200).json(
        new ApiResponse(200, dispute, `Dispute has been successfully resolutioned: ${status.toLowerCase()}.`)
    );
});

module.exports = {
    getPendingVerifications,
    verifyFreelancerDocs,
    getUsersList,
    blockOrUnblockUser,
    getDisputes,
    resolveDispute
};
