import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },

    provider: { type: String, default: "local" },

    // 🔐 EMAIL VERIFICATION
    isVerified: { type: Boolean, default: false },
    verifyToken: String,
    verifyExpires: Date,

    // 🔁 PASSWORD RESET
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // 🔒 BRUTE FORCE
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // 📱 SESSIONS
    sessions: [
      {
        userAgent: String,
        ip: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);