import { Types } from "mongoose";
import Booking, { SessionType } from "../models/booking.model";
import { CreateBookingDto } from "../dtos/booking.dto";
import { BookingStatus } from "../models/booking.model";

interface CreateBookingData {
  learner: string;
  mentor: string;
  package: string;
  packageTitle: string;
  packagePrice: number;
  sessionType: SessionType;
}

interface ListFilter {
  status?: BookingStatus;
  page: number;
  limit: number;
}

export const bookingRepository = {
  create(data: CreateBookingData) {
    return Booking.create(data);
  },

  findById(id: string) {
    return Booking.findById(id);
  },

  findByIdAndMentor(id: string, mentorId: string) {
    return Booking.findOne({ _id: id, mentor: new Types.ObjectId(mentorId) });
  },

  findByIdAndLearner(id: string, learnerId: string) {
    return Booking.findOne({ _id: id, learner: new Types.ObjectId(learnerId) });
  },

  async findAllByMentor(mentorId: string, filter: ListFilter) {
    const query: Record<string, any> = {
      mentor: new Types.ObjectId(mentorId),
      status: { $ne: "cancelled" }, // learner-cancelled bookings are invisible to mentor
    };
    if (filter.status && filter.status !== "cancelled") query.status = filter.status;

    const skip = (filter.page - 1) * filter.limit;

    const [items, total] = await Promise.all([
      Booking.find(query)
        .populate("learner", "fullname profilePhoto")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit),
      Booking.countDocuments(query),
    ]);

    return { items, total, page: filter.page, limit: filter.limit };
  },

  async findAllByLearner(learnerId: string, filter: ListFilter) {
    const query: Record<string, any> = { learner: new Types.ObjectId(learnerId) };
    if (filter.status) query.status = filter.status;

    const skip = (filter.page - 1) * filter.limit;

    const [items, total] = await Promise.all([
      Booking.find(query)
        .populate("mentor", "fullname profilePhoto")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filter.limit),
      Booking.countDocuments(query),
    ]);

    return { items, total, page: filter.page, limit: filter.limit };
  },

  updateStatus(id: string, status: BookingStatus) {
    return Booking.findByIdAndUpdate(
      id,
      { status, respondedAt: new Date() },
      { new: true }
    );
  },

  cancel(id: string) {
    return Booking.findByIdAndUpdate(
      id,
      { status: "cancelled", respondedAt: new Date() },
      { new: true }
    );
  },

  markAsPaid(id: string, paymentIntentId: string) {
  return Booking.findByIdAndUpdate(
    id,
    { status: "paid", stripePaymentIntentId: paymentIntentId, paidAt: new Date() },
    { new: true }
  );
},
};