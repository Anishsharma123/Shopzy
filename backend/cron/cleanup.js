import cron from "node-cron";
import User from "../models/User.js";

cron.schedule("0 * * * *", async () => {
  try {
    console.log("🧹 Running cleanup job...");

    await User.updateMany(
      {
        resetPasswordExpires: { $lt: Date.now() },
      },
      {
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: "",
        },
      }
    );

    console.log("✅ Cleanup completed");

  } catch (error) {
    console.log("❌ Cleanup error:", error);
  }
});