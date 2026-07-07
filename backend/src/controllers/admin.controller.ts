import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin.service";
import { listUsersQuerySchema, updateUserStatusSchema } from "../dtos/admin.dto";
import { listDisputesQuerySchema } from "../dtos/booking.dto";
import { listAuditLogsQuerySchema } from "../dtos/audit-log.dto";

function getContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

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
      const data = await adminService.updateUserStatus(id, dto.status, req.user!.id, getContext(req));
      res.status(200).json({ success: true, message: "User status updated", data });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await adminService.deleteUser(id, req.user!.id, getContext(req));
      res.status(200).json({ success: true, message: "User deleted", data });
    } catch (err) {
      next(err);
    }
  },

  async listDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listDisputesQuerySchema.parse(req.query);
      const data = await adminService.listDisputes(query);
      res.status(200).json({ success: true, message: "Disputes retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async resolveDisputeRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await adminService.resolveDisputeRefund(id, req.user!.id, getContext(req));
      res.status(200).json({ success: true, message: "Dispute resolved with refund", data });
    } catch (err) {
      next(err);
    }
  },

  async resolveDisputeReject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await adminService.resolveDisputeReject(id, req.user!.id, getContext(req));
      res.status(200).json({ success: true, message: "Dispute rejected", data });
    } catch (err) {
      next(err);
    }
  },


  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listAuditLogsQuerySchema.parse(req.query);
    const data = await adminService.listAuditLogs(query);
    res.status(200).json({ success: true, message: "Audit logs retrieved", data });
  } catch (err) {
    next(err);
  }
},
};