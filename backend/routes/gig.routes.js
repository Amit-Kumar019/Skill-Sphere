const { Router } = require("express");
const {
    getCategoriesAndSkills,
    createGig,
    getGigs,
    getMyGigs,
    getGigDetails,
    submitProposal,
    getMyProposals,
    handleProposalStatus
} = require("../controllers/gig.controller");
const { verifyJWT } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/multer.middleware");

const router = Router();

// Public endpoints
router.get("/categories", getCategoriesAndSkills);
router.get("/", getGigs);

// Private endpoints (Require Authentication)
router.post(
    "/",
    verifyJWT,
    upload.fields([{ name: "attachments", maxCount: 5 }]),
    createGig
);
router.get("/my-gigs", verifyJWT, getMyGigs);
router.get("/proposals/my-proposals", verifyJWT, getMyProposals);
router.get("/:id", verifyJWT, getGigDetails);
router.post(
    "/:id/proposals",
    verifyJWT,
    upload.fields([{ name: "attachments", maxCount: 3 }]),
    submitProposal
);
router.patch("/proposals/:id/status", verifyJWT, handleProposalStatus);

module.exports = router;
