const { Router } = require("express");
const {
    createCheckoutSession,
    verifyPayment,
    getMyTransactions
} = require("../controllers/payment.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

const router = Router();

// Apply auth middleware to all payment routes
router.use(verifyJWT);

router.post("/checkout-session", createCheckoutSession);
router.post("/verify", verifyPayment);
router.get("/history", getMyTransactions);

module.exports = router;
