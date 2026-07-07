import { userRepository } from "../repositories/user.repository";
import { ValidationError, ConflictError } from "../errors/AppError";
import { AccountStatus } from "../models/user.model";
import { bookingRepository } from "../../src/repositories/booking.repository";
import { stripeClient } from "../utils/stripe.util";
import { auditLogService } from "./audit-log.service";
import { auditLogRepository } from "../repositories/audit-log.repository";

interface ListUsersParams {
  page: number;
  limit: number;
  role?: string;
  status?: AccountStatus;
  search?: string;
}

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export const adminService = {
  async listUsers(params: ListUsersParams) {
    return userRepository.findAllPaginated(params);
  },

  async updateUserStatus(id: string, status: AccountStatus, actingAdminId: string, ctx: RequestContext = {}) {
    if (id === actingAdminId) {
      throw new ConflictError("Admins cannot change their own account status");
    }

    const user = await userRepository.findById(id);
    if (!user) throw new ValidationError("User not found");
    if (user.isDeleted) throw new ValidationError("User not found");

    const result = await userRepository.updateStatus(id, status);

    await auditLogService.log({
      actor: actingAdminId,
      action: status === "suspended" ? "USER_SUSPENDED" : "USER_REACTIVATED",
      targetType: "User",
      targetId: id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return result;
  },

  async deleteUser(id: string, actingAdminId: string, ctx: RequestContext = {}) {
    if (id === actingAdminId) {
      throw new ConflictError("Admins cannot delete their own account");
    }

    const user = await userRepository.findById(id);
    if (!user) throw new ValidationError("User not found");
    if (user.isDeleted) throw new ValidationError("User already deleted");

    const result = await userRepository.softDelete(id);

    await auditLogService.log({
      actor: actingAdminId,
      action: "USER_DELETED",
      targetType: "User",
      targetId: id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return result;
  },

  async listDisputes(params: { page: number; limit: number }) {
    return bookingRepository.findAllDisputed(params);
  },

  async resolveDisputeRefund(bookingId: string, actingAdminId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new ValidationError("Booking not found");
    if (booking.status !== "disputed") {
      throw new ValidationError("Only disputed bookings can be refunded");
    }
    if (!booking.stripePaymentIntentId) {
      throw new ValidationError("No payment record found for this booking");
    }

    await stripeClient.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
    });

    const result = await bookingRepository.resolveDisputeRefunded(bookingId);

    await auditLogService.log({
      actor: actingAdminId,
      action: "REFUND_ISSUED",
      targetType: "Booking",
      targetId: bookingId,
      metadata: { amount: booking.packagePrice, stripePaymentIntentId: booking.stripePaymentIntentId },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return result;
  },

  async resolveDisputeReject(bookingId: string, actingAdminId: string, ctx: RequestContext = {}) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new ValidationError("Booking not found");
    if (booking.status !== "disputed") {
      throw new ValidationError("Only disputed bookings can be rejected");
    }

    const result = await bookingRepository.resolveDisputeRejected(bookingId);

    await auditLogService.log({
      actor: actingAdminId,
      action: "DISPUTE_REJECTED",
      targetType: "Booking",
      targetId: bookingId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return result;
  },


  async listAuditLogs(params: { page: number; limit: number }) {
  return auditLogRepository.findAllPaginated(params);
},
};