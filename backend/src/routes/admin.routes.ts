import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { adminIpAllowlist } from "../middlewares/adminIpAllowlist.middleware";
import { adminController } from "../controllers/admin.controller";

const router = Router();

router.use(adminIpAllowlist, protect, restrictTo("admin"));

router.get("/users", adminController.listUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

router.get("/disputes", adminController.listDisputes);
router.patch("/disputes/:id/refund", adminController.resolveDisputeRefund);
router.patch("/disputes/:id/reject", adminController.resolveDisputeReject);
router.get("/audit-logs", adminController.listAuditLogs);

export default router;