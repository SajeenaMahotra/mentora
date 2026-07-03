import { categoryRepository } from "../repositories/category.repository";
import { ConflictError, ValidationError } from "../errors/AppError";
import { Types } from "mongoose";
import Package from "../models/package.model";
import User from "../models/user.model";

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const categoryService = {
  async listAll() {
    return categoryRepository.findAll();
  },

  async create(name: string, createdBy: string) {
    const existing = await categoryRepository.findByName(name);
    if (existing) throw new ConflictError("A category with this name already exists");

    const slug = generateSlug(name);
    const slugTaken = await categoryRepository.findBySlug(slug);
    if (slugTaken) throw new ConflictError("A category with a conflicting slug already exists");

    return categoryRepository.create({ name, slug, createdBy: new Types.ObjectId(createdBy) });
  },

  async update(id: string, name: string) {
  const existing = await categoryRepository.findByName(name);
  if (existing && existing._id.toString() !== id) {
    throw new ConflictError("A category with this name already exists");
  }

  const slug = generateSlug(name);
  const slugTaken = await categoryRepository.findBySlug(slug);
  if (slugTaken && slugTaken._id.toString() !== id) {
    throw new ConflictError("A category with a conflicting slug already exists");
  }

  const updated = await categoryRepository.update(id, { name, slug });
  if (!updated) throw new ValidationError("Category not found");
  return updated;
},

  async delete(id: string) {
    const [packageRef, mentorRef] = await Promise.all([
      Package.exists({ subject: id }),
      User.exists({ subjects: id }),
    ]);

    if (packageRef || mentorRef) {
      throw new ConflictError("Cannot delete a category that is in use by mentors or packages");
    }

    const deleted = await categoryRepository.delete(id);
    if (!deleted) throw new ValidationError("Category not found");
    return deleted;
  },
};