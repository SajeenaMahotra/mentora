import { Router } from "express";
import { protect, restrictTo } from "../middlewares/auth.middleware";
import { reviewController } from "../controllers/review.controller";

const router = Router();

// Public — anyone browsing a mentor's profile can see their reviews.
router.get("/mentor/:mentorId", reviewController.listForMentor);

// Learner-only — router isn't fully protected like booking.routes.ts,
// so protect/restrictTo are applied directly on this route.
router.get("/mine", protect, restrictTo("learner"), reviewController.myReviewedBookings);

export default router;