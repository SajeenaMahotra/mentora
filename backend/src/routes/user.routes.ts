import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { userController } from "../controllers/user.controller";
import { handleProfilePhotoUpload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/verify-email", userController.verifyEmail);

router.use(protect);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);
router.post("/me/photo", handleProfilePhotoUpload, userController.updatePhoto);
router.patch("/me/password", userController.changePassword);
router.patch("/me/email", userController.changeEmail);
router.patch("/me/subjects", userController.updateSubjects);

export default router;