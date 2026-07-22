import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { requireCaptcha } from "../middlewares/captcha.middleware";
import { authLimiter } from "../middlewares/rateLimiters";
import { checkIpNotBlocked } from "../middlewares/ipBlock.middleware";
import { adminIpAllowlist } from "../middlewares/adminIpAllowlist.middleware";
import passport from "../config/passport";
import { env } from "../config/env";

const router = Router();

router.post("/register", checkIpNotBlocked, authLimiter, requireCaptcha, authController.register);
router.post("/login", checkIpNotBlocked, authLimiter, requireCaptcha, authController.login);
router.post("/mfa/login-verify", checkIpNotBlocked, authLimiter, authController.verifyMfaLogin);
router.post("/force-change-password", checkIpNotBlocked, authLimiter, authController.forceChangePassword);
router.post("/unlock-account", checkIpNotBlocked, authLimiter, authController.unlockAccount);
router.post("/forgot-password", checkIpNotBlocked, authLimiter, authController.forgotPassword);
router.post("/reset-password", checkIpNotBlocked, authLimiter, authController.resetPassword);

router.post("/mfa/setup", protect, authController.setupMfa);
router.post("/mfa/verify-setup", protect, authController.verifyMfaSetup);

router.patch("/admin/unlock/:userId", adminIpAllowlist, protect, restrictTo("admin"), authController.adminUnlockAccount);
router.post("/disable-mfa", protect, authController.disableMfa);
router.post("/logout", protect, authController.logout);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    (err: any, user: Express.User | false) => {
      if (err) {
        // Covers ConflictError from googleLogin (e.g. email already registered
        // locally) as well as any other error thrown inside the strategy.
        const message = err.message || "google_auth_failed";
        return res.redirect(`${env.CLIENT_URL}/auth/google/error?message=${encodeURIComponent(message)}`);
      }
      if (!user) {
        return res.redirect(`${env.CLIENT_URL}/auth/google/error`);
      }
      req.user = user;
      return authController.googleCallback(req, res, next);
    }
  )(req, res, next);
});

export default router;