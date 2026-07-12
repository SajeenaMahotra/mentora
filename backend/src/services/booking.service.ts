import logger from "../config/logger";
import { bookingRepository } from "../repositories/booking.repository";
import { packageRepository } from "../repositories/package.repository";
import { CreateBookingDto, ListBookingsQueryDto } from "../dtos/booking.dto";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/AppError";
import { stripeClient } from "../../src/utils/stripe.util";
import { auditLogService } from "./audit-log.service";
import { notificationService } from "./notification.service";

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export const bookingService = {
  async createBooking(learnerId: string, dto: CreateBookingDto) {
    const pkg = await packageRepository.findById(dto.packageId);
    if (!pkg) throw new NotFoundError("Package not found");

    if (pkg.mentor.toString() === learnerId) {
      throw new ForbiddenError("You cannot book your own package");
    }

    const booking = await bookingRepository.create({
      learner: learnerId,
      mentor: pkg.mentor.toString(),
      package: pkg.id,
      packageTitle: pkg.title,
      packagePrice: pkg.price,
      sessionType: pkg.sessionType,
    });

    try {
      await notificationService.create({
        recipient: pkg.mentor.toString(),
        type: "booking_requested",
        title: "New booking request",
        body: `You have a new booking request for "${pkg.title}"`,
        link: "/mentor/bookings",
        relatedType: "Booking",
        relatedId: booking.id,
      });
    } catch (err) {
      logger.error("Failed to create notification", { err });
    }

    return booking;
  },

  async listForMentor(mentorId: string, query: ListBookingsQueryDto) {
    return bookingRepository.findAllByMentor(mentorId, query);
  },

  async listForLearner(learnerId: string, query: ListBookingsQueryDto) {
    return bookingRepository.findAllByLearner(learnerId, query);
  },

  async acceptBooking(mentorId: string, bookingId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findByIdAndMentor(bookingId, mentorId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "pending") {
      throw new ValidationError("Only pending bookings can be accepted");
    }

    const result = await bookingRepository.updateStatus(bookingId, "accepted");

    await auditLogService.log({
      actor: mentorId,
      action: "BOOKING_ACCEPTED",
      targetType: "Booking",
      targetId: bookingId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    try {
      await notificationService.create({
        recipient: booking.learner.toString(),
        type: "booking_accepted",
        title: "Booking accepted",
        body: `Your booking for "${booking.packageTitle}" was accepted`,
        link: "/bookings",
        relatedType: "Booking",
        relatedId: bookingId,
      });
    } catch (err) {
      logger.error("Failed to create notification", { err });
    }

    return result;
  },

  async declineBooking(mentorId: string, bookingId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findByIdAndMentor(bookingId, mentorId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "pending") {
      throw new ValidationError("Only pending bookings can be declined");
    }

    const result = await bookingRepository.updateStatus(bookingId, "declined");

    await auditLogService.log({
      actor: mentorId,
      action: "BOOKING_DECLINED",
      targetType: "Booking",
      targetId: bookingId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    try {
      await notificationService.create({
        recipient: booking.learner.toString(),
        type: "booking_declined",
        title: "Booking declined",
        body: `Your booking for "${booking.packageTitle}" was declined`,
        link: "/bookings",
        relatedType: "Booking",
        relatedId: bookingId,
      });
    } catch (err) {
      logger.error("Failed to create notification", { err });
    }

    return result;
  },

  async cancelBooking(learnerId: string, bookingId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findByIdAndLearner(bookingId, learnerId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "pending") {
      throw new ValidationError("Only pending bookings can be cancelled");
    }

    const result = await bookingRepository.cancel(bookingId);

    await auditLogService.log({
      actor: learnerId,
      action: "BOOKING_CANCELLED",
      targetType: "Booking",
      targetId: bookingId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    try {
      await notificationService.create({
        recipient: booking.mentor.toString(),
        type: "booking_cancelled",
        title: "Booking cancelled",
        body: `The learner cancelled their request for "${booking.packageTitle}"`,
        link: "/mentor/bookings",
        relatedType: "Booking",
        relatedId: bookingId,
      });
    } catch (err) {
      logger.error("Failed to create notification", { err });
    }

    return result;
  },

  async createCheckoutSession(learnerId: string, bookingId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findByIdAndLearner(bookingId, learnerId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "accepted") {
      throw new ValidationError("Only accepted bookings can be paid for");
    }

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "npr",
            product_data: { name: booking.packageTitle },
            unit_amount: Math.round(booking.packagePrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/bookings?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/bookings?payment=cancelled`,
      metadata: {
        bookingId: booking.id,
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    await auditLogService.log({
      actor: learnerId,
      action: "CHECKOUT_SESSION_CREATED",
      targetType: "Booking",
      targetId: bookingId,
      metadata: { amount: booking.packagePrice },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { checkoutUrl: session.url };
  },

  async markAsCompleted(mentorId: string, bookingId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findByIdAndMentor(bookingId, mentorId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "paid") {
      throw new ValidationError("Only paid bookings can be marked as completed");
    }

    const result = await bookingRepository.markAsCompleted(bookingId);

    await auditLogService.log({
      actor: mentorId,
      action: "BOOKING_COMPLETED",
      targetType: "Booking",
      targetId: bookingId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    try {
      await notificationService.create({
        recipient: booking.learner.toString(),
        type: "booking_completed",
        title: "Session marked complete",
        body: `Your mentor marked "${booking.packageTitle}" as complete. You have 3 days to raise a dispute if needed.`,
        link: "/bookings",
        relatedType: "Booking",
        relatedId: bookingId,
      });
    } catch (err) {
      logger.error("Failed to create notification", { err });
    }

    return result;
  },

  async raiseDispute(learnerId: string, bookingId: string, reason: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findByIdAndLearner(bookingId, learnerId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "completed") {
      throw new ValidationError("Only completed bookings can be disputed");
    }

    if (!booking.disputeDeadline || new Date() > booking.disputeDeadline) {
      throw new ValidationError("The dispute window for this booking has closed");
    }

    const result = await bookingRepository.markAsDisputed(bookingId, reason);

    await auditLogService.log({
      actor: learnerId,
      action: "DISPUTE_RAISED",
      targetType: "Booking",
      targetId: bookingId,
      metadata: { reason },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    try {
      await notificationService.create({
        recipient: booking.mentor.toString(),
        type: "dispute_raised",
        title: "Dispute raised",
        body: `A dispute was raised against your session "${booking.packageTitle}"`,
        link: "/mentor/bookings",
        relatedType: "Dispute",
        relatedId: bookingId,
      });
    } catch (err) {
      logger.error("Failed to create notification", { err });
    }

    return result;
  },
};