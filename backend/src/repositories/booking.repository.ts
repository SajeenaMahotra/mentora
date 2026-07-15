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

  // Idempotent: only transitions "accepted" -> "paid", and only for the session that
  // matches the booking's currently active stripeSessionId. A duplicate/stale webhook
  // firing for an older, already-superseded checkout session is a no-op instead of
  // silently overwriting the payment record of a session that already succeeded.
  markAsPaid(id: string, paymentIntentId: string, stripeSessionId: string) {
    return Booking.findOneAndUpdate(
      { _id: id, status: "accepted", stripeSessionId },
      { status: "paid", stripePaymentIntentId: paymentIntentId, paidAt: new Date() },
      { new: true }
    );
  },

  markAsCompleted(id: string) {
    const completedAt = new Date();
    const disputeDeadline = new Date(completedAt.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

    return Booking.findByIdAndUpdate(
      id,
      { status: "completed", completedAt, disputeDeadline },
      { new: true }
    );
  },



  markAsDisputed(id: string, reason: string) {
    return Booking.findByIdAndUpdate(
      id,
      { status: "disputed", disputeReason: reason, disputedAt: new Date() },
      { new: true }
    );
  },

  async findAllDisputed(filter: { page: number; limit: number }) {
    const query: { status: BookingStatus } = { status: "disputed" };
    const skip = (filter.page - 1) * filter.limit;

    const [items, total] = await Promise.all([
      Booking.find(query)
        .populate("learner", "fullname profilePhoto email")
        .populate("mentor", "fullname profilePhoto email")
        .sort({ disputedAt: -1 })
        .skip(skip)
        .limit(filter.limit),
      Booking.countDocuments(query),
    ]);

    return { items, total, page: filter.page, limit: filter.limit };
  },

  resolveDisputeRefunded(id: string) {
    return Booking.findByIdAndUpdate(id, { status: "refunded" }, { new: true });
  },

  resolveDisputeRejected(id: string) {
    return Booking.findByIdAndUpdate(id, { status: "completed" }, { new: true });
  },


  findAllForExport(userId: string, role: "learner" | "mentor") {
    const filter = role === "mentor"
      ? { mentor: new Types.ObjectId(userId) }
      : { learner: new Types.ObjectId(userId) };

    return Booking.find(filter).sort({ createdAt: -1 }).lean();
  },
};