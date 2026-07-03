import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { categoryController } from "../controllers/category.controller";

const router = Router();

router.use(protect);

router.get("/", categoryController.listAll);
router.post("/", restrictTo("admin"), categoryController.create);
router.patch("/:id", restrictTo("admin"), categoryController.update);
router.delete("/:id", restrictTo("admin"), categoryController.remove);

export default router;