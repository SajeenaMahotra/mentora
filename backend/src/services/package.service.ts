import { CreatePackageDto, UpdatePackageDto } from "../dtos/package.dto";
import { packageRepository } from "../repositories/package.repository";
import Category from "../models/category.model";
import { ValidationError, ForbiddenError } from "../errors/AppError";
import { userService } from "./user.service";

export const packageService = {
  async createPackage(mentorId: string, dto: CreatePackageDto) {
    const category = await Category.findById(dto.subject);
    if (!category) throw new ValidationError("Subject category not found");

    const pkg = await packageRepository.create(mentorId, dto);

    // re-check profile setup completeness now that a package exists
    await userService.checkAndUpdateProfileSetup(mentorId);

    return pkg;
  },

  async listMine(mentorId: string) {
    return packageRepository.findAllByMentor(mentorId);
  },

  async updatePackage(mentorId: string, packageId: string, dto: UpdatePackageDto) {
    if (dto.subject) {
      const category = await Category.findById(dto.subject);
      if (!category) throw new ValidationError("Subject category not found");
    }

    const existing = await packageRepository.findByIdAndMentor(packageId, mentorId);
    if (!existing) throw new ForbiddenError("Package not found or not owned by you");

    return packageRepository.update(packageId, dto);
  },
};