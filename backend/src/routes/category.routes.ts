import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { categoryController } from "../controllers/category.controller";

const router = Router();

router.use(protect);
router.get("/", categoryController.listAll);

export default router;