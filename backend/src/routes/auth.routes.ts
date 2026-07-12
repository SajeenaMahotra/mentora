import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { requireCaptcha } from "../middlewares/captcha.middleware";
import { authLimiter } from "../middlewares/rateLimiters";
import { checkIpNotBlocked } from "../middlewares/ipBlock.middleware";

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

router.patch("/admin/unlock/:userId", protect, restrictTo("admin"), authController.adminUnlockAccount);
router.post("/disable-mfa", protect, authController.disableMfa);

export default router;