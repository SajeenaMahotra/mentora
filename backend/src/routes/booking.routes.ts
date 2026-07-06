import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { bookingController } from "../controllers/booking.controller";

const router = Router();

router.use(protect);

router.post("/", restrictTo("learner"), bookingController.create);
router.get("/learner", restrictTo("learner"), bookingController.listForLearner);
router.patch("/:id/cancel", restrictTo("learner"), bookingController.cancel);
router.post("/:id/checkout", restrictTo("learner"), bookingController.checkout);

router.get("/mentor", restrictTo("mentor"), bookingController.listForMentor);
router.patch("/:id/accept", restrictTo("mentor"), bookingController.accept);
router.patch("/:id/decline", restrictTo("mentor"), bookingController.decline);

export default router;