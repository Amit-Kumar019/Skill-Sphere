const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Get token from Cookie or Authorization Header
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized Request");
        }

        // Verify JWT
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find User
        const user = await User.findById(decodedToken.id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // Attach user to request
        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Invalid Access Token"
        );
    }
});

module.exports = { verifyJWT };