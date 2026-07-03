import Category from "../models/category.model";

export const categoryRepository = {
  findAll() {
    return Category.find().sort({ name: 1 });
  },
};