import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";

export const categoryController = {
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await categoryService.listAll();
      res.status(200).json({ success: true, message: "Categories retrieved", data });
    } catch (err) {
      next(err);
    }
  },
};