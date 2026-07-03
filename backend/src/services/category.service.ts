import { categoryRepository } from "../repositories/category.repository";

export const categoryService = {
  async listAll() {
    return categoryRepository.findAll();
  },
};