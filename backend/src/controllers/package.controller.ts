import { Request, Response, NextFunction } from "express";
import { createPackageSchema, updatePackageSchema } from "../dtos/package.dto";
import { packageService } from "../services/package.service";

export const packageController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createPackageSchema.parse(req.body);
      const data = await packageService.createPackage(req.user!.id, dto);
      res.status(201).json({ success: true, message: "Package created", data });
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await packageService.listMine(req.user!.id);
      res.status(200).json({ success: true, message: "Packages retrieved", data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = updatePackageSchema.parse(req.body);
      const packageId = req.params.id as string;
      const data = await packageService.updatePackage(req.user!.id, packageId, dto);
      res.status(200).json({ success: true, message: "Package updated", data });
    } catch (err) {
      next(err);
    }
  },
};