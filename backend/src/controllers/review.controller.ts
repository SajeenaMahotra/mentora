import { Request, Response, NextFunction } from "express";
import { createReviewSchema, listReviewsQuerySchema } from "../dtos/review.dto";
import { reviewService } from "../services/review.service";

export const reviewController = {
  // Mounted at POST /bookings/:id/review — bookingId comes from the
  // booking router's :id param, same convention as accept/decline/dispute.
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const dto = createReviewSchema.parse(req.body);
      const data = await reviewService.createReview(req.user!.id, bookingId, dto);
      res.status(201).json({ success: true, message: "Review submitted", data });
    } catch (err) {
      next(err);
    }
  },

  // Public — no auth required to view a mentor's reviews.
  async listForMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const mentorId = req.params.mentorId as string;
      const query = listReviewsQuerySchema.parse(req.query);
      const data = await reviewService.getForMentor(mentorId, query);
      res.status(200).json({ success: true, message: "Reviews retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  // Learner-only. Returns booking IDs the current learner has already
  // reviewed, so the frontend can hide the "leave a review" action.
  async myReviewedBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reviewService.getMyReviewedBookingIds(req.user!.id);
      res.status(200).json({ success: true, message: "Reviewed booking IDs retrieved", data });
    } catch (err) {
      next(err);
    }
  },
};