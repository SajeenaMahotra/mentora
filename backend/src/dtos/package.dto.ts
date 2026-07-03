import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

export const createPackageSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(2000),
  subject: objectIdSchema,
  durationValue: z.number().int().positive(),
  durationUnit: z.enum(["day", "week", "month"]),
  sessionType: z.enum(["online", "in-person", "hybrid"]),
  price: z.number().positive(),
});
export type CreatePackageDto = z.infer<typeof createPackageSchema>;

export const updatePackageSchema = createPackageSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
export type UpdatePackageDto = z.infer<typeof updatePackageSchema>;