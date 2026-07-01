import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, mfaVerifySetupSchema, mfaLoginVerifySchema, unlockAccountSchema } from "../dtos/user.dto";
import { authService } from "../services/auth.service";

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
      const result = await authService.login(dto);

      if (result.mfaRequired) {
        return res.status(200).json({
          success: true,
          message: "MFA verification required",
          mfaRequired: true,
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
      const result = await authService.verifyMfaSetup(req.user!.id, dto.token);
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
      const { token, data } = await authService.verifyMfaLogin(dto);
      res.status(200).json({ success: true, message: "Welcome back!", data, token });
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
      const result = await authService.adminUnlockAccount(userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  },
};