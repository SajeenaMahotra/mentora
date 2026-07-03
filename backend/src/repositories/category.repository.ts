import Category, { ICategory } from "../models/category.model";
import { Types } from "mongoose";

export const categoryRepository = {
  async findAll(): Promise<ICategory[]> {
    return Category.find().sort({ name: 1 });
  },

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  },

  async findByName(name: string): Promise<ICategory | null> {
    return Category.findOne({ name });
  },

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug });
  },

  async create(data: { name: string; slug: string; createdBy: Types.ObjectId }): Promise<ICategory> {
    return Category.create(data);
  },

  async update(id: string, data: { name: string; slug: string }): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  async delete(id: string): Promise<ICategory | null> {
    return Category.findByIdAndDelete(id);
  },
};