const Payment = require("../models/Payment");
const Milestone = require("../models/Milestone");
const Gig = require("../models/Gig");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const stripe = require("stripe");

// Initialize Stripe if secret key is present
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecret ? stripe(stripeSecret) : null;

// ========================= CREATE CHECKOUT SESSION =========================
const createCheckoutSession = asyncHandler(async (req, res) => {
    const { milestoneId } = req.body;
    const userId = req.user._id;

    if (!milestoneId) {
        throw new ApiError(400, "Milestone ID is required.");
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
        throw new ApiError(404, "Milestone not found.");
    }

    const gig = await Gig.findById(milestone.gig);
    if (!gig) {
        throw new ApiError(404, "Gig associated with milestone not found.");
    }

    // Verify ownership
    if (gig.client.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the client who posted the gig can make payments.");
    }

    if (milestone.paymentStatus === "Paid") {
        throw new ApiError(400, "This milestone has already been paid.");
    }

    // If Stripe is configured
    if (stripeClient) {
        try {
            const session = await stripeClient.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: `Milestone Payment: ${milestone.title}`,
                                description: milestone.description || `Payment for Gig: ${gig.title}`,
                            },
                            unit_amount: Math.round(milestone.amount * 100), // in cents
                        },
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/gigs/${gig._id}?payment_success=true&milestoneId=${milestone._id}`,
                cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/gigs/${gig._id}?payment_cancel=true`,
                metadata: {
                    milestoneId: milestone._id.toString(),
                    gigId: gig._id.toString(),
                    clientId: userId.toString(),
                    freelancerId: gig.hiredFreelancer ? gig.hiredFreelancer.toString() : "",
                }
            });

            return res.status(200).json(
                new ApiResponse(200, { id: session.id, url: session.url, isMock: false }, "Stripe checkout session created.")
            );
        } catch (error) {
            console.error("Stripe Checkout Error:", error);
            // Fallback to simulation if Stripe fails due to credentials/API issues
        }
    }

    // Fallback: Simulation Mode
    console.log("Stripe not configured or failed. Falling back to Simulation Payment Mode.");
    const mockSession = {
        id: `mock_session_${Date.now()}`,
        url: `/gigs/${gig._id}?checkout_simulation=true&milestoneId=${milestone._id}`,
        isMock: true,
        amount: milestone.amount,
        milestoneTitle: milestone.title
    };

    return res.status(200).json(
        new ApiResponse(200, mockSession, "Simulation checkout session created.")
    );
});

// ========================= VERIFY / COMPLETE MOCK PAYMENT =========================
const verifyPayment = asyncHandler(async (req, res) => {
    const { milestoneId, transactionId, status } = req.body;
    const userId = req.user._id;

    if (!milestoneId) {
        throw new ApiError(400, "Milestone ID is required.");
    }

    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
        throw new ApiError(404, "Milestone not found.");
    }

    const gig = await Gig.findById(milestone.gig);
    if (!gig) {
        throw new ApiError(404, "Gig not found.");
    }

    if (gig.client.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized access.");
    }

    if (milestone.paymentStatus === "Paid") {
        return res.status(200).json(
            new ApiResponse(200, null, "Milestone is already marked as paid.")
        );
    }

    // Update milestone payment status
    milestone.paymentStatus = "Paid";
    milestone.status = "Approved"; // Automatically approve milestone when paid
    await milestone.save();

    // Create Payment record
    const payment = await Payment.create({
        gig: gig._id,
        milestone: milestone._id,
        client: gig.client,
        freelancer: gig.hiredFreelancer,
        amount: milestone.amount,
        paymentMethod: "Stripe",
        transactionId: transactionId || `txn_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: status || "Completed"
    });

    // Notify client and freelancer about payment (Sockets trigger)
    const io = req.app.get("io");
    if (io) {
        // Notify freelancer
        io.to(`user_${gig.hiredFreelancer}`).emit("notification", {
            type: "Payment",
            title: "Milestone Paid",
            message: `Milestone "${milestone.title}" has been successfully paid by the client. Amount: $${milestone.amount}`,
            gigId: gig._id
        });
    }

    return res.status(201).json(
        new ApiResponse(201, payment, "Payment successfully processed and verified.")
    );
});

// ========================= GET TRANSACTIONS HISTORY =========================
const getMyTransactions = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const role = req.user.role;

    let query = {};
    if (role === "client") {
        query.client = userId;
    } else if (role === "freelancer") {
        query.freelancer = userId;
    } else {
        query = { $or: [{ client: userId }, { freelancer: userId }] };
    }

    const payments = await Payment.find(query)
        .populate("gig", "title")
        .populate("milestone", "title")
        .populate("client", "username firstName lastName avatar")
        .populate("freelancer", "username firstName lastName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, payments, "Transactions history fetched successfully.")
    );
});

module.exports = {
    createCheckoutSession,
    verifyPayment,
    getMyTransactions
};
