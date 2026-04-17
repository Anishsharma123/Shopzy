import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) return done(new Error("No email from Google"), null);

        let user = await User.findOne({ email });
        console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
        console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

        if (!user) {
          user = await User.create({
            email,
            // mark this user as OAuth user (no real password)
            password: "GOOGLE_OAUTH",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;