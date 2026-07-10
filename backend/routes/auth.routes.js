const { Router } = require("express");
const {
    signup,
    login,
    logout,
    refreshAccessToken,
    getCurrentUser,
    googleLogin,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
} = require("../controllers/auth.controller");
const { verifyJWT } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

const router = Router();

// Public Routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/google", googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected Routes
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);

// Testing RBAC
// router.get(
//     "/admin-test",
//     verifyJWT,
//     authorizeRoles("admin"),
//     (req, res) => {
//         res.status(200).json({
//             success: true,
//             message: "Welcome Admin!"
//         });
//     }
// );

module.exports = router;