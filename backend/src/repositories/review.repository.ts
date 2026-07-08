import { Types } from "mongoose";
import ReviewModel, { IReview } from "../models/review.model";

interface CreateReviewInput {
  booking: Types.ObjectId | string;
  learner: Types.ObjectId | string;
  mentor: Types.ObjectId | string;
  rating: number;
  comment?: string;
}

interface ListForMentorOptions {
  page?: number;
  limit?: number;
}

interface PaginatedReviews {
  reviews: IReview[];
  total: number;
  page: number;
  totalPages: number;
}

interface RatingAggregate {
  averageRating: number;
  ratingCount: number;
}

export const reviewRepository = {
  create(data: CreateReviewInput): Promise<IReview> {
    return ReviewModel.create(data);
  },

  findByBooking(bookingId: Types.ObjectId | string): Promise<IReview | null> {
    return ReviewModel.findOne({ booking: bookingId });
  },

  async findAllForMentor(
    mentorId: Types.ObjectId | string,
    options: ListForMentorOptions = {}
  ): Promise<PaginatedReviews> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter = { mentor: mentorId };

    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter)
        .populate("learner", "fullname profilePhoto")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReviewModel.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  async computeRatingAggregate(mentorId: Types.ObjectId | string): Promise<RatingAggregate> {
    const result = await ReviewModel.aggregate([
      { $match: { mentor: new Types.ObjectId(mentorId) } },
      {
        $group: {
          _id: "$mentor",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { averageRating: 0, ratingCount: 0 };
    }

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      ratingCount: result[0].ratingCount,
    };
  },

  async findBookingIdsForLearner(learnerId: Types.ObjectId | string): Promise<string[]> {
    const ids = await ReviewModel.distinct("booking", { learner: learnerId });
    return ids.map((id) => id.toString());
  },
};