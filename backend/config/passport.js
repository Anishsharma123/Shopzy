import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/User.js";

// GOOGLE OAUTH STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,

      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        // check existing user
        let user = await User.findOne({
          email: profile.emails[0].value,
        });

        // create user if not exists
        if (!user) {
          user = await User.create({
            email: profile.emails[0].value,

            provider: "google",

            isVerified: true,
          });
        }

        return done(null, user);

      } catch (error) {
        console.log("GOOGLE AUTH ERROR:", error);

        return done(error, null);
      }
    }
  )
);

export default passport;