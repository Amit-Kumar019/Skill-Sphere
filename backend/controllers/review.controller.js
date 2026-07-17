const Review = require("../models/Review");
const Gig = require("../models/Gig");
const FreelancerProfile = require("../models/FreelancerProfile");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { sendNotification } = require("../utils/notification");

// ========================= CREATE REVIEW =========================
const createReview = asyncHandler(async (req, res) => {
    const { gigId, freelancerId, rating, comment } = req.body;
    const clientId = req.user._id;

    if (!gigId || !freelancerId || !rating) {
        throw new ApiError(400, "Gig ID, Freelancer ID, and Rating (1-5) are required.");
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5.");
    }

    // Verify gig exists and client is owner
    const gig = await Gig.findById(gigId);
    if (!gig) {
        throw new ApiError(404, "Gig not found.");
    }

    if (gig.client.toString() !== clientId.toString()) {
        throw new ApiError(403, "Only the client owner of this gig can submit a review.");
    }

    // Verify freelancer is hired on this gig
    if (!gig.hiredFreelancer || gig.hiredFreelancer.toString() !== freelancerId.toString()) {
        throw new ApiError(400, "This freelancer was not hired for this gig.");
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ gig: gigId, client: clientId, freelancer: freelancerId });
    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this freelancer for this gig.");
    }

    // Create Review
    const review = await Review.create({
        gig: gigId,
        client: clientId,
        freelancer: freelancerId,
        rating: numericRating,
        comment: comment || ""
    });

    // Recalculate average rating for freelancer
    const allReviews = await Review.find({ freelancer: freelancerId });
    const totalReviews = allReviews.length;
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    // Update FreelancerProfile
    await FreelancerProfile.findOneAndUpdate(
        { user: freelancerId },
        {
            $set: {
                rating: Number(avgRating.toFixed(2)),
                totalReviews: totalReviews
            }
        }
    );

    // Send Real-Time & DB Notification
    await sendNotification(req.app, {
        receiver: freelancerId,
        sender: clientId,
        title: "New Review Received",
        message: `Client ${req.user.firstName} left you a ${numericRating}-star review for the gig "${gig.title}".`,
        type: "Review"
    });

    return res.status(201).json(
        new ApiResponse(201, review, "Review submitted successfully and profile rating updated.")
    );
});

// ========================= GET FREELANCER REVIEWS =========================
const getFreelancerReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reviews = await Review.find({ freelancer: id })
        .populate("client", "username firstName lastName avatar")
        .populate("gig", "title")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, reviews, "Freelancer reviews fetched successfully.")
    );
});

module.exports = {
    createReview,
    getFreelancerReviews
};
