import { Request, Response, NextFunction } from "express";
import { updateProfileSchema, changePasswordSchema, changeEmailSchema, verifyEmailSchema, updateSubjectsSchema, importDataSchema, updateRoleSchema } from "../dtos/user.dto";
import { userService } from "../services/user.service";
import { ValidationError } from "../errors/AppError";
import User from "../models/user.model";
import path from "path";
import { setAuthCookie } from "../utils/cookie.util";

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

  // --- NEW: privacy/data-portability export. Returns raw JSON, not the standard { success, message, data } shape,
  // since this is meant to be downloaded as a file rather than consumed as a normal API response.
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await userService.exportUserData(req.user!.id);
      res.setHeader("Content-Disposition", `attachment; filename="mentora-data-export.json"`);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  },

  // --- NEW: privacy/data-portability import. Counterpart to exportData.
  async importData(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = importDataSchema.parse(req.body);
      const data = await userService.importUserData(req.user!.id, dto);
      res.status(200).json({ success: true, message: "Profile data imported", data });
    } catch (err) {
      next(err);
    }
  },


  async getPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id).select("profilePhoto");
      if (!user || !user.profilePhoto) {
        return res.status(404).json({ success: false, message: "Photo not found" });
      }
      const filePath = path.join(process.cwd(), "uploads", "profile-photos", user.profilePhoto);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  },

  // --- NEW: resolves "me" to the authenticated user's own id server-side, instead of
  // relying on the generic /:id/photo route (which was casting the literal string
  // "me" to an ObjectId and throwing a CastError, since Express matched "me" as
  // the :id param before this route existed).
  async getMyPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!.id).select("profilePhoto");
      if (!user || !user.profilePhoto) {
        return res.status(404).json({ success: false, message: "Photo not found" });
      }
      const filePath = path.join(process.cwd(), "uploads", "profile-photos", user.profilePhoto);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  },


  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updateRoleSchema.parse(req.body);
      const result = await userService.updateRole(req.user!.id, dto.role);

      setAuthCookie(res, result.token);

      res.status(200).json({ success: true, message: "Role updated", data: result.data });
    } catch (err) {
      next(err);
    }
  },
};
