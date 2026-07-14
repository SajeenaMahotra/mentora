import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, mfaVerifySetupSchema, mfaLoginVerifySchema, unlockAccountSchema, forgotPasswordSchema, resetPasswordSchema, disableMfaSchema, forceChangePasswordSchema } from "../dtos/user.dto";
import { authService } from "../services/auth.service";

function getContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = registerSchema.parse(req.body);
      const user = await authService.register(dto);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await authService.login(dto, getContext(req));

      if (result.mfaRequired) {
        return res.status(200).json({
          success: true,
          message: "MFA verification required",
          mfaRequired: true,
          tempToken: result.tempToken,
        });
      }

      // --- NEW: password expired, block full login, hand back a temp token instead.
      if (result.passwordChangeRequired) {
        return res.status(200).json({
          success: true,
          message: "Your password has expired. Please set a new one to continue.",
          passwordChangeRequired: true,
          tempToken: result.tempToken,
        });
      }

      res.status(200).json({
        success: true,
        message: "Welcome back!",
        data: result.data,
        token: result.token,
      });
    } catch (err) {
      next(err);
    }
  },

  // req.user set by `protect` middleware
  async setupMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.setupMfa(req.user!.id);
      res.status(200).json({ success: true, message: "Scan the QR code in your authenticator app", data: result });
    } catch (err) {
      next(err);
    }
  },

  async verifyMfaSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = mfaVerifySetupSchema.parse(req.body);
      const result = await authService.verifyMfaSetup(req.user!.id, dto.token, getContext(req));
      res.status(200).json({
        success: true,
        message: "MFA enabled. Save these recovery codes somewhere safe — they won't be shown again.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyMfaLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = mfaLoginVerifySchema.parse(req.body);
      const result = await authService.verifyMfaLogin(dto, getContext(req));

      // --- NEW: password expired after MFA succeeded, block full login, hand back a temp token.
      if (result.passwordChangeRequired) {
        return res.status(200).json({
          success: true,
          message: "Your password has expired. Please set a new one to continue.",
          passwordChangeRequired: true,
          tempToken: result.tempToken,
        });
      }

      res.status(200).json({ success: true, message: "Welcome back!", data: result.data, token: result.token });
    } catch (err) {
      next(err);
    }
  },

  // --- NEW: final step after passwordChangeRequired:true from login or mfa/login-verify.
  async forceChangePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = forceChangePasswordSchema.parse(req.body);
      const result = await authService.forceChangePassword(dto, getContext(req));
      res.status(200).json({ success: true, message: "Password updated. Welcome back!", data: result.data, token: result.token });
    } catch (err) {
      next(err);
    }
  },

  async unlockAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = unlockAccountSchema.parse(req.body);
      const result = await authService.unlockAccount(dto);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  // admin-only
  async adminUnlockAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const result = await authService.adminUnlockAccount(userId, req.user!.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(dto);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(dto, getContext(req));
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  async disableMfa(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = disableMfaSchema.parse(req.body);
      const data = await authService.disableMfa(req.user!.id, dto, getContext(req));
      res.status(200).json({ success: true, message: data.message, data: null });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.logout(req.user!.id, getContext(req));
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },
};