import express from "express";
import { body } from "express-validator";
import passport from "passport";
import jwt from "jsonwebtoken";

import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ================= REGISTER =================
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number"),
  ],
  registerUser
);

// ================= LOGIN =================
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email"),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  loginUser
);

// ================= GOOGLE LOGIN =================

// 🔥 STEP 1: Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔥 STEP 2: Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/",
  }),
  (req, res) => {
    try {
      // ✅ Create JWT like normal login
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      // 🍪 Set cookie
      res.cookie("accessToken", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      });

      // 🔁 Redirect to frontend
      res.redirect("http://localhost:5173/home");
    } catch (error) {
      console.log("❌ GOOGLE LOGIN ERROR:", error);
      res.redirect("http://localhost:5173/");
    }
  }
);

// ================= TOKEN =================
router.post("/refresh", refreshToken);

// ================= LOGOUT =================
router.post("/logout", logoutUser);

// ================= GET USER =================
router.get("/me", protect, getMe);

// ================= PASSWORD RESET =================
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;