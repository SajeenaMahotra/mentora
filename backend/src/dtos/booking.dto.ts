import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

export const createBookingSchema = z.object({
  packageId: objectIdSchema,
});
export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const listBookingsQuerySchema = z.object({
  status: z.enum(["pending", "accepted", "declined", "cancelled", "paid", "completed"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
export type ListBookingsQueryDto = z.infer<typeof listBookingsQuerySchema>;