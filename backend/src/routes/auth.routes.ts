import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { requireCaptcha } from "../middlewares/captcha.middleware";
import { authLimiter } from "../middlewares/rateLimiters";

const router = Router();

router.post("/register", authLimiter, requireCaptcha, authController.register);
router.post("/login", authLimiter, requireCaptcha, authController.login);
router.post("/mfa/login-verify", authLimiter, authController.verifyMfaLogin);
router.post("/unlock-account", authLimiter, authController.unlockAccount);
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authLimiter, authController.resetPassword);

router.post("/mfa/setup", protect, authController.setupMfa);
router.post("/mfa/verify-setup", protect, authController.verifyMfaSetup);

router.patch("/admin/unlock/:userId", protect, restrictTo("admin"), authController.adminUnlockAccount);

export default router;