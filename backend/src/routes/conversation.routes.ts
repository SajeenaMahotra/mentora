import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { startConversation, listConversations, getMessages } from "../controllers/conversation.controller";

const router = Router();

router.use(protect);

router.post("/", restrictTo("learner", "mentor"), startConversation);
router.get("/", listConversations);
router.get("/:id/messages", getMessages);

export default router;
