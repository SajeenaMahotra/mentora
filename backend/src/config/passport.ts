import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { Request } from "express";
import { env } from "./env";
import { authService } from "../services/auth.service";
import { UnauthorizedError } from "../errors/AppError";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req: Request, _accessToken: string, _refreshToken: string, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const emailVerified = profile.emails?.[0]?.verified;

        if (!email) {
          return done(new UnauthorizedError("Google account has no accessible email"));
        }
        if (emailVerified === false) {
          return done(new UnauthorizedError("Google account email is not verified"));
        }

        const result = await authService.googleLogin(
          { googleId: profile.id, email, fullname: profile.displayName || email },
          { ip: req.ip, userAgent: req.headers["user-agent"] }
        );

        req.googleAuthToken = result.token;
        req.googleAuthUser = result.data;

        return done(null, { id: result.data._id, role: result.data.role });
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;