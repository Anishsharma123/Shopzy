import express from "express";
import { body } from "express-validator";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

// ✅ REGISTER ROUTE WITH VALIDATION
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

// ✅ LOGIN ROUTE WITH VALIDATION
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

// ✅ REFRESH TOKEN
router.post("/refresh", refreshToken);

// ✅ LOGOUT
router.post("/logout", logoutUser);

export default router;