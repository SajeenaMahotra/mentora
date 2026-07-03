import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import { createCategorySchema, updateCategorySchema } from "../dtos/category.dto";

export const categoryController = {
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.listAll();
      res.status(200).json({ success: true, message: "Categories retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createCategorySchema.parse(req.body);
      const data = await categoryService.create(dto.name, req.user!.id);
      res.status(201).json({ success: true, message: "Category created", data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const dto = updateCategorySchema.parse(req.body);
      const data = await categoryService.update(id, dto.name);
      res.status(200).json({ success: true, message: "Category updated", data });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await categoryService.delete(id);
      res.status(200).json({ success: true, message: "Category deleted", data });
    } catch (err) {
      next(err);
    }
  },
};