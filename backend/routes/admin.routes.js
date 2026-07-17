const { Router } = require("express");
const {
    getPendingVerifications,
    verifyFreelancerDocs,
    getUsersList,
    blockOrUnblockUser,
    getDisputes,
    resolveDispute
} = require("../controllers/admin.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

const router = Router();

// Apply auth middleware to all admin routes
router.use(verifyJWT);

router.get("/verifications", getPendingVerifications);
router.patch("/verifications/:verificationId", verifyFreelancerDocs);

router.get("/users", getUsersList);
router.patch("/users/:userId/block", blockOrUnblockUser);

router.get("/disputes", getDisputes);
router.patch("/disputes/:disputeId/resolve", resolveDispute);

module.exports = router;
