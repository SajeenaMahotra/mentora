import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;