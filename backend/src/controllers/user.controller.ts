import { Request, Response, NextFunction } from "express";
import { updateProfileSchema, changePasswordSchema, changeEmailSchema, verifyEmailSchema, updateSubjectsSchema } from "../dtos/user.dto";
import { userService } from "../services/user.service";
import { ValidationError } from "../errors/AppError";

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.getProfile(req.user!.id);
      res.status(200).json({ success: true, message: "Profile retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateProfileSchema.parse(req.body);
      const data = await userService.updateProfile(req.user!.id, dto);
      res.status(200).json({ success: true, message: "Profile updated", data });
    } catch (err) {
      next(err);
    }
  },

  async updatePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ValidationError("No image file provided");
      const data = await userService.updateProfilePhoto(req.user!.id, req.file.filename);
      res.status(200).json({ success: true, message: "Profile photo updated", data });
    } catch (err) {
      next(err);
    }
  },


  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = changePasswordSchema.parse(req.body);
      const data = await userService.changePassword(req.user!.id, dto);
      res.status(200).json({ success: true, message: data.message, data: null });
    } catch (err) {
      next(err);
    }
  },

  async changeEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = changeEmailSchema.parse(req.body);
      const data = await userService.changeEmail(req.user!.id, dto);
      res.status(200).json({ success: true, message: data.message, data: null });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = verifyEmailSchema.parse(req.body);
      const data = await userService.verifyEmail(dto);
      res.status(200).json({ success: true, message: data.message, data: null });
    } catch (err) {
      next(err);
    }
  },

  async updateSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateSubjectsSchema.parse(req.body);
      const data = await userService.updateSubjects(req.user!.id, dto.subjects);
      res.status(200).json({ success: true, message: "Subjects updated", data });
    } catch (err) {
      next(err);
    }
  },
};