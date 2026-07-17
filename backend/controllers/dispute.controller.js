const Dispute = require("../models/Dispute");
const Payment = require("../models/Payment");
const Gig = require("../models/Gig");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { sendNotification } = require("../utils/notification");

const createDispute = asyncHandler(async (req, res) => {
    const { milestoneId, gigId, reason } = req.body;

    if (!milestoneId || !gigId || !reason) {
        throw new ApiError(400, "Milestone ID, Gig ID, and Reason are required.");
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
        throw new ApiError(404, "Gig not found.");
    }

    const payment = await Payment.findOne({ milestone: milestoneId });
    if (!payment) {
        throw new ApiError(404, "Payment record not found for this milestone.");
    }

    const paymentId = payment._id;

    const userId = req.user._id.toString();
    const isClient = gig.client.toString() === userId;
    const isFreelancer = gig.hiredFreelancer && gig.hiredFreelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
        throw new ApiError(403, "You are not authorized to raise a dispute for this gig.");
    }

    const existingDispute = await Dispute.findOne({ payment: paymentId });
    if (existingDispute) {
        throw new ApiError(400, "A dispute already exists for this payment milestone.");
    }

    const dispute = await Dispute.create({
        payment: paymentId,
        gig: gigId,
        client: gig.client,
        freelancer: gig.hiredFreelancer,
        reason,
        status: "Open"
    });

    const otherPartyId = isClient ? gig.hiredFreelancer : gig.client;
    await sendNotification(req.app, {
        receiver: otherPartyId,
        sender: req.user._id,
        title: "Dispute Raised",
        message: `${req.user.firstName} has raised a dispute on the gig "${gig.title}". Status is now under review by platform admins.`,
        type: "System"
    });

    return res.status(201).json(
        new ApiResponse(201, dispute, "Dispute raised successfully. Admins have been notified.")
    );
});

module.exports = { createDispute };
