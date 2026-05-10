import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "passport";

import authRoutes from "./routes/authRoutes.js";

// passport config
import "./config/passport.js";

// cron cleanup
import "./cron/cleanup.js";

const app = express();

// ================= SECURITY =================
app.use(helmet());

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

// ================= LOGIN RATE LIMIT =================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

app.use("/api/auth/login", loginLimiter);

// ================= CORS =================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ================= BODY PARSER =================
app.use(express.json());

// ================= COOKIE PARSER =================
app.use(cookieParser());

// ================= PASSPORT =================
app.use(passport.initialize());

// ================= ROUTES =================
app.use("/api/auth", authRoutes);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ================= DATABASE =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => console.log(err));