const { Router } = require("express");
const {
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
} = require("../controllers/profile.controller");
const { verifyJWT } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/multer.middleware");

const router = Router();

// Private Routes (Require Authentication)
router.get("/me", verifyJWT, getMyProfile);
router.post(
    "/me",
    verifyJWT,
    upload.fields([
        { name: "resume", maxCount: 1 },
        { name: "companyLogo", maxCount: 1 },
        { name: "avatar", maxCount: 1 },
    ]),
    createOrUpdateProfile
);

// Portfolio management routes
router.post(
    "/me/portfolio",
    verifyJWT,
    upload.fields([{ name: "images", maxCount: 5 }]),
    addPortfolioItem
);
router.delete(
    "/me/portfolio/:portfolioId",
    verifyJWT,
    deletePortfolioItem
);

// Verification routes
router.post(
    "/me/verification",
    verifyJWT,
    upload.fields([
        { name: "aadhaar", maxCount: 1 },
        { name: "pan", maxCount: 1 },
        { name: "selfie", maxCount: 1 }
    ]),
    submitVerificationDocs
);

// Availability routes
router.post(
    "/me/availability",
    verifyJWT,
    updateAvailability
);

// Public Routes (Directory/Search/Public View)
router.get("/freelancer/:id", getFreelancerProfile);
router.get("/freelancer/:id/portfolio", getFreelancerPortfolio);
router.get("/freelancer/:id/availability", getFreelancerAvailability);
router.get("/client/:id", getClientProfile);
router.get("/freelancers", getFreelancers);

module.exports = router;
