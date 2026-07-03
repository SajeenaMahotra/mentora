import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;