const { Router } = require("express");
const {
    getMyProfile,
    createOrUpdateProfile,
    getFreelancerProfile,
    getClientProfile,
    getFreelancers,
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

// Public Routes (Directory/Search/Public View)
router.get("/freelancer/:id", getFreelancerProfile);
router.get("/client/:id", getClientProfile);
router.get("/freelancers", getFreelancers);

module.exports = router;
