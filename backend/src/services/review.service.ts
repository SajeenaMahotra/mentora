import { bookingRepository } from "../repositories/booking.repository";
import { reviewRepository } from "../repositories/review.repository";
import { userRepository } from "../repositories/user.repository";
import { NotFoundError, ValidationError, ConflictError } from "../errors/AppError";

interface CreateReviewDto {
  rating: number;
  comment?: string;
}

interface ListReviewsQuery {
  page?: number;
  limit?: number;
}

export const reviewService = {
  async createReview(learnerId: string, bookingId: string, dto: CreateReviewDto) {
    const booking = await bookingRepository.findByIdAndLearner(bookingId, learnerId);
    if (!booking) throw new NotFoundError("Booking not found");

    if (booking.status !== "completed") {
      throw new ValidationError("Only completed bookings can be reviewed");
    }

    // Friendly pre-check before hitting the DB's unique constraint on
    // `booking` — the schema-level unique index remains the real guard
    // against a race between two rapid submissions.
    const existing = await reviewRepository.findByBooking(bookingId);
    if (existing) {
      throw new ConflictError("You have already reviewed this booking");
    }

    const review = await reviewRepository.create({
      booking: bookingId,
      learner: learnerId,
      mentor: booking.mentor,
      rating: dto.rating,
      comment: dto.comment,
    }).catch((err: any) => {
      // Fallback for the race the pre-check above can't fully close:
      // two near-simultaneous submissions can both pass findByBooking
      // before either write lands. The schema's unique index on
      // `booking` stops the second write at the DB level — this just
      // turns that into the same clean error instead of a raw Mongo one.
      if (err?.code === 11000) {
        throw new ConflictError("You have already reviewed this booking");
      }
      throw err;
    });

    const aggregate = await reviewRepository.computeRatingAggregate(booking.mentor);
    await userRepository.updateRatingStats(
      booking.mentor.toString(),
      aggregate.averageRating,
      aggregate.ratingCount
    );

    return review;
  },

  async getForMentor(mentorId: string, query: ListReviewsQuery = {}) {
    const [list, mentor] = await Promise.all([
      reviewRepository.findAllForMentor(mentorId, query),
      userRepository.findById(mentorId),
    ]);

    return {
      ...list,
      averageRating: mentor?.averageRating ?? 0,
      ratingCount: mentor?.ratingCount ?? 0,
    };
  },

  async getMyReviewedBookingIds(learnerId: string) {
    return reviewRepository.findBookingIdsForLearner(learnerId);
  },
};