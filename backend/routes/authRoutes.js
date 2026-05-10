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
  verifyEmail,
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

// 🔥 Redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// 🔥 Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/",
  }),
  async (req, res) => {
    try {
      // create access token
      const accessToken = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      // create refresh token
      const refreshToken = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const cookieOptions = {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      };

      // send cookies
      res
        .cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000,
        })
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

      // redirect frontend
      res.redirect("http://localhost:5173/home");

    } catch (error) {
      console.log("GOOGLE CALLBACK ERROR:", error);

      res.redirect("http://localhost:5173/");
    }
  }
);

// ================= VERIFY EMAIL =================
router.get("/verify/:token", verifyEmail);

// ================= REFRESH TOKEN =================
router.post("/refresh", refreshToken);

// ================= LOGOUT =================
router.post("/logout", logoutUser);

// ================= GET CURRENT USER =================
router.get("/me", protect, getMe);

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", forgotPassword);

// ================= RESET PASSWORD =================
router.post("/reset-password/:token", resetPassword);

export default router;