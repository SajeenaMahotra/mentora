import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["learner", "mentor", "admin"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;