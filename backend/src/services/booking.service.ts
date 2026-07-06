import { bookingRepository } from "../repositories/booking.repository";
import { packageRepository } from "../repositories/package.repository";
import { CreateBookingDto, ListBookingsQueryDto } from "../dtos/booking.dto";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/AppError";
import { stripeClient } from "../../src/utils/stripe.util";

export const bookingService = {
  async createBooking(learnerId: string, dto: CreateBookingDto) {
    const pkg = await packageRepository.findById(dto.packageId);
    if (!pkg) throw new NotFoundError("Package not found");

    // mentor can't book their own package
    if (pkg.mentor.toString() === learnerId) {
      throw new ForbiddenError("You cannot book your own package");
    }

    return bookingRepository.create({
      learner: learnerId,
      mentor: pkg.mentor.toString(),
      package: pkg.id,
      packageTitle: pkg.title,
      packagePrice: pkg.price,
      sessionType: pkg.sessionType,
    });
  },

  async listForMentor(mentorId: string, query: ListBookingsQueryDto) {
    return bookingRepository.findAllByMentor(mentorId, query);
  },

  async listForLearner(learnerId: string, query: ListBookingsQueryDto) {
    return bookingRepository.findAllByLearner(learnerId, query);
  },

  async acceptBooking(mentorId: string, bookingId: string) {
    const booking = await bookingRepository.findByIdAndMentor(bookingId, mentorId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "pending") {
      throw new ValidationError("Only pending bookings can be accepted");
    }

    return bookingRepository.updateStatus(bookingId, "accepted");
  },

  async declineBooking(mentorId: string, bookingId: string) {
    const booking = await bookingRepository.findByIdAndMentor(bookingId, mentorId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "pending") {
      throw new ValidationError("Only pending bookings can be declined");
    }

    return bookingRepository.updateStatus(bookingId, "declined");
  },

  async cancelBooking(learnerId: string, bookingId: string) {
    const booking = await bookingRepository.findByIdAndLearner(bookingId, learnerId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "pending") {
      throw new ValidationError("Only pending bookings can be cancelled");
    }

    return bookingRepository.cancel(bookingId);
  },


  async createCheckoutSession(learnerId: string, bookingId: string) {
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

    return { checkoutUrl: session.url };
  },
};