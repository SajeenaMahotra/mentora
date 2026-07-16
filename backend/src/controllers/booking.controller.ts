import { Request, Response, NextFunction } from "express";
import { createBookingSchema, listBookingsQuerySchema, raiseDisputeSchema } from "../dtos/booking.dto";
import { bookingService } from "../services/booking.service";
import { env } from "../config/env";

function getContext(req: Request) {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

export const bookingController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createBookingSchema.parse(req.body);
      const data = await bookingService.createBooking(req.user!.id, dto);
      res.status(201).json({ success: true, message: "Booking request sent", data });
    } catch (err) {
      next(err);
    }
  },

  async listForMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listBookingsQuerySchema.parse(req.query);
      const data = await bookingService.listForMentor(req.user!.id, query);
      res.status(200).json({ success: true, message: "Bookings retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async listForLearner(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listBookingsQuerySchema.parse(req.query);
      const data = await bookingService.listForLearner(req.user!.id, query);
      res.status(200).json({ success: true, message: "Bookings retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const data = await bookingService.acceptBooking(req.user!.id, bookingId, getContext(req));
      res.status(200).json({ success: true, message: "Booking accepted", data });
    } catch (err) {
      next(err);
    }
  },

  async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const data = await bookingService.declineBooking(req.user!.id, bookingId, getContext(req));
      res.status(200).json({ success: true, message: "Booking declined", data });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const data = await bookingService.cancelBooking(req.user!.id, bookingId, getContext(req));
      res.status(200).json({ success: true, message: "Booking cancelled", data });
    } catch (err) {
      next(err);
    }
  },

  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;

      const allowedOrigins = [env.CLIENT_URL, ...env.CLIENT_URLS.split(",").map((o) => o.trim())];
      const requestOrigin = req.headers.origin;
      const origin = requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : env.CLIENT_URL;

      const data = await bookingService.createCheckoutSession(req.user!.id, bookingId, origin, getContext(req));
      res.status(200).json({ success: true, message: "Checkout session created", data });
    } catch (err) {
      next(err);
    }
  },

  async markComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const data = await bookingService.markAsCompleted(req.user!.id, bookingId, getContext(req));
      res.status(200).json({ success: true, message: "Booking marked as completed", data });
    } catch (err) {
      next(err);
    }
  },

  async dispute(req: Request, res: Response, next: NextFunction) {
    try {
      const bookingId = req.params.id as string;
      const dto = raiseDisputeSchema.parse(req.body);
      const data = await bookingService.raiseDispute(req.user!.id, bookingId, dto.reason, getContext(req));
      res.status(200).json({ success: true, message: "Dispute raised", data });
    } catch (err) {
      next(err);
    }
  },
};