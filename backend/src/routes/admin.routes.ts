import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { adminController } from "../controllers/admin.controller";

const router = Router();

router.use(protect, restrictTo("admin"));

router.get("/users", adminController.listUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

export default router;