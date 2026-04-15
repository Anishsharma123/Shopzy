import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import helmet from "helmet";

dotenv.config();

const app = express();


// 🛡️ SECURITY HEADERS
app.use(helmet());


// 🔐 GLOBAL RATE LIMIT
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);


// 🔐 LOGIN RATE LIMIT
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});
app.use("/api/auth/login", loginLimiter);


// 🌐 CORS (MUST come before cookies & routes)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));


// 🔧 BODY PARSER
app.use(express.json());


// 🍪 COOKIE PARSER (BEFORE CSRF)
app.use(cookieParser());


// 🔐 CSRF PROTECTION (APPLY AFTER COOKIE PARSER)
const csrfProtection = csrf({ cookie: true });

// 👉 Only protect sensitive routes (NOT login/register)
app.use("/api/protected", csrfProtection);


// 🔑 CSRF TOKEN ROUTE
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});


// 🔗 ROUTES
app.use("/api/auth", authRoutes);


// 🧪 TEST ROUTE
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});


// 🗄️ DATABASE
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.log(err));