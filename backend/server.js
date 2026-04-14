// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import authRoutes from "./routes/authRoutes.js";
// import cookieParser from "cookie-parser";
// import rateLimit from "express-rate-limit";

// //CORS = allows frontend to talk to backend

// dotenv.config();

// const app = express();

// //Rate Limit
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });

// app.use(limiter);
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
// });
// app.use("/api/auth/login", loginLimiter);

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use("/api/auth", authRoutes);
// app.use(cookieParser());

// // Test route
// app.get("/", (req, res) => {
//   res.send("API is running 🚀");
// });


// // Connect MongoDB
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB Connected ✅");
//     app.listen(5000, () => console.log("Server running on port 5000"));
//   })
//   .catch((err) => console.log(err));

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


// 🔐 GLOBAL RATE LIMIT
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

//CSRF
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

//helmet
app.use(helmet());


// 🔐 LOGIN RATE LIMIT (STRICT)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});
app.use("/api/auth/login", loginLimiter);


// 🔧 MIDDLEWARE
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); // BEFORE routes


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