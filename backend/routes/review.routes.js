const { Router } = require("express");
const {
    createReview,
    getFreelancerReviews
} = require("../controllers/review.controller");
const { verifyJWT } = require("../middleware/auth.middleware");

const router = Router();

router.post("/", verifyJWT, createReview);
router.get("/freelancer/:id", getFreelancerReviews);

module.exports = router;
