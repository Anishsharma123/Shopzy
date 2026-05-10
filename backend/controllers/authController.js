import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { validationResult } from "express-validator";
import { sendEmail } from "../utils/sendEmail.js";

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // check existing user
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    // create user
    const user = await User.create({
      email,
      password: hashedPassword,
      verifyToken: hashedVerifyToken,
      verifyExpires: Date.now() + 10 * 60 * 1000,
    });

    // verification URL
    const verifyUrl = `http://localhost:5173/verify/${verifyToken}`;

    // send verification email
    await sendEmail(
      user.email,
      "Verify Your Email",
      `Click the link below to verify your email:\n\n${verifyUrl}`
    );

    res.status(201).json({
      message: "Registered successfully. Check your email to verify account.",
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= VERIFY EMAIL =================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      verifyToken: hashedToken,
      verifyExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyExpires = undefined;

    await user.save();

    res.json({
      message: "Email verified successfully",
    });

  } catch (error) {
    console.log("VERIFY ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // prevent password login for google users
    if (user.provider === "google") {
      return res.status(400).json({
        message: "Please login using Google",
      });
    }

    // email verification check
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    // brute force protection
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        message: "Account locked. Try again later.",
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }

      await user.save();

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // reset attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // session tracking
    user.sessions.push({
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    await user.save();

    // access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? "7d" : "1d" }
    );

    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    };

    res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: rememberMe
          ? 7 * 24 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000,
      })
      .json({
        message: "Login successful",
      });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // hash token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // reset URL
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // send email
    await sendEmail(
      user.email,
      "Reset Password",
      `Click the link below to reset your password:\n\n${resetUrl}`
    );

    res.json({
      message: "Password reset email sent",
    });

  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ================= LOGOUT =================
export const logoutUser = (req, res) => {
  res
    .clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
    })
    .json({
      message: "Logged out successfully",
    });
};

// ================= REFRESH TOKEN =================
export const refreshToken = (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      message: "No refresh token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      message: "Token refreshed",
    });

  } catch (error) {
    console.log("REFRESH TOKEN ERROR:", error);

    res.status(403).json({
      message: "Invalid refresh token",
    });
  }
};

// ================= GET CURRENT USER =================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    res.json({
      user,
    });

  } catch (error) {
    console.log("GET ME ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};