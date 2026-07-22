const User = require("../models/Users");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// Helper function to generate Access & Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens.",
    );
  }
};

// ========================= SIGNUP =========================
const signup = asyncHandler(async (req, res) => {
  const { username, firstName, lastName, email, password, role } = req.body;

  if (
    [username, firstName, lastName, email, password, role].some(
      (field) => !field || field.trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists with this email or username.");
  }

  // Generate Verification Token (expires in 24 hours)
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    username: username.toLowerCase(),
    firstName,
    lastName,
    email,
    password,
    role,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpires: tokenExpiry,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to register user.");
  }

  // Send Verification Email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to Skill Sphere!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for registering. Please verify your email address to unlock all premium features of Skill Sphere.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; 2026 Skill Sphere. All rights reserved.</p>
      </div>
    `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your email - Skill Sphere",
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    createdUser._id,
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          accessToken,
          refreshToken,
        },
        "User registered successfully. A verification email has been sent.",
      ),
    );
});

// ========================= LOGIN =========================
const login = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Email or Username is required.");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful.",
      ),
    );
});

// ========================= LOGOUT =========================
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});

// ========================= REFRESH ACCESS TOKEN =========================
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_SECRET,
    );

    const user = await User.findById(decodedToken.id).select("+refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token has expired or is invalid.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id,
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access token refreshed successfully.",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

// ========================= CURRENT USER =========================
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully."));
});

// ========================= GOOGLE LOGIN =========================
const googleLogin = asyncHandler(async (req, res) => {
  const { token, role } = req.body;

  if (!token) {
    throw new ApiError(400, "Google token is required.");
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new ApiError(401, "Invalid Google token.");
  }

  const {
    sub: googleId,
    email,
    given_name: firstName,
    family_name: lastName,
    picture,
  } = payload;

  if (!email) {
    throw new ApiError(400, "Email not returned by Google.");
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      await user.save();
    }
  } else {
    let username = email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      username = `${username}${crypto.randomBytes(3).toString("hex")}`;
    }

    user = await User.create({
      firstName: firstName || "Google",
      lastName: lastName || "User",
      username,
      email,
      role: role || "client",
      googleId,
      isEmailVerified: true,
      avatar: {
        url: picture || "",
        public_id: "",
      },
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Google login successful.",
      ),
    );
});

// ========================= VERIFY EMAIL =========================
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Verification token is required.");
  }

  const user = await User.findOne({ emailVerificationToken: token }).select(
    "+emailVerificationToken +emailVerificationTokenExpires",
  );

  if (!user) {
    throw new ApiError(400, "Invalid verification token.");
  }

  // Check if token has expired
  if (
    user.emailVerificationTokenExpires &&
    new Date() > user.emailVerificationTokenExpires
  ) {
    throw new ApiError(
      400,
      "Verification token has expired. Please request a new one.",
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationTokenExpires = null;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully."));
});

// ========================= RESEND VERIFICATION EMAIL =========================
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified.");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  user.emailVerificationToken = verificationToken;
  user.emailVerificationTokenExpires = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Verify your Email Address</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a verification link. Please verify your email address to unlock all premium features of Skill Sphere.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; 2026 Skill Sphere. All rights reserved.</p>
      </div>
    `;

  await sendEmail({
    email: user.email,
    subject: "Verify your email - Skill Sphere",
    html: emailHtml,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Verification email sent successfully."));
});

// ========================= FORGOT PASSWORD =========================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist.");
  }

  if (user.googleId && !user.password) {
    throw new ApiError(
      400,
      "This email is registered via Google OAuth. Please sign in with Google.",
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Reset your Password</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset for your Skill Sphere account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p>This password reset link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; 2026 Skill Sphere. All rights reserved.</p>
      </div>
    `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request - Skill Sphere",
      html: emailHtml,
    });
  } catch (error) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(
      500,
      "Error sending password reset email. Please try again later.",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset email sent successfully."));
});

// ========================= RESET PASSWORD =========================
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "New password is required.");
  }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long.");
  }

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired password reset token.");
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been reset successfully."));
});

module.exports = {
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
};

