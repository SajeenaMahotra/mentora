import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

router.use(protect);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);

export default router;