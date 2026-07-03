import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin.service";
import { listUsersQuerySchema, updateUserStatusSchema } from "../dtos/admin.dto";

export const adminController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listUsersQuerySchema.parse(req.query);
      const data = await adminService.listUsers(query);
      res.status(200).json({ success: true, message: "Users retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const dto = updateUserStatusSchema.parse(req.body);
      const data = await adminService.updateUserStatus(id, dto.status, req.user!.id);
      res.status(200).json({ success: true, message: "User status updated", data });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await adminService.deleteUser(id, req.user!.id);
      res.status(200).json({ success: true, message: "User deleted", data });
    } catch (err) {
      next(err);
    }
  },
};