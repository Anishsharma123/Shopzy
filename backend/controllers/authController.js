import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import crypto from "crypto";

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log("📥 TOKEN FROM URL:", token);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log("🔒 HASHED TOKEN FROM URL:", hashedToken);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    console.log("👤 USER FOUND:", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.log("❌ RESET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 🔥 DEBUG LOGS
    console.log("🔑 RAW TOKEN (URL):", resetToken);
    console.log("🔒 HASHED TOKEN SAVED (DB):", hashedToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    console.log("🔗 RESET URL:", resetUrl);

    res.json({
      message: "Password reset link generated",
      resetUrl, // 🔥 send link to frontend
    });
  } catch (error) {
    console.log("❌ FORGOT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const userResponse = {
      _id: user.id,
      email: user.email,
    };

    res.status(201).json({
      message: "User registered successfully",
      userResponse,
    });
  } catch (error) {
    console.log("❌ REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30s",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "7d" : "1m",
    });

    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    };

    res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 30 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 1000,
      })
      .json({ message: "Login successful" });
  } catch (error) {
    console.log("❌ LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
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
    .json({ message: "Logged out Successfully." });
};

// ================= REFRESH TOKEN =================
export const refreshToken = (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log("❌ REFRESH ERROR:", error);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// ================= GET ME =================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    res.json({ user });
  } catch (error) {
    console.log("❌ GETME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
