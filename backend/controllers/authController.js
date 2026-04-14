import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // check user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    // remove password before sending
    const userResponse = {
      _id: user.id,
      email: user.email,
    };

    res.status(201).json({
      message: "User registered successfully",
      userResponse,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;

    // check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res
      .cookie("accessToken", token, {
        httpOnly: true, //JS can’t access it
        secure: false, //true in production in https
        sameSite: "strict", //prevents CSRF
        maxAge: 15 * 60 * 1000, //15min
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: "User logged in successfully.",
      });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({
    message: "Logged out Successfully.",
  });
};

export const refreshToken = (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    // ✅ Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Generate NEW access token
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // 🔥 Generate NEW refresh token (ROTATION)
    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 🍪 Send both tokens in cookies
    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false, // true in production (HTTPS)
        maxAge: 15 * 60 * 1000, // 15 min
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ message: "Token refreshed successfully" });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};
