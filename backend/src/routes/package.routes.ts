import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { restrictTo } from "../middlewares/auth.middleware";
import { packageController } from "../controllers/package.controller";

const router = Router();

router.get("/", packageController.listAll);

router.use(protect, restrictTo("mentor"));
router.post("/", packageController.create);
router.get("/mine", packageController.listMine);
router.patch("/:id", packageController.update);
router.delete("/:id", packageController.delete);

export default router;