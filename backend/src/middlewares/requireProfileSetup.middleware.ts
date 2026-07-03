import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/user.repository";
import { ForbiddenError } from "../errors/AppError";

export async function requireProfileSetup(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userRepository.findById(req.user!.id);
    if (!user) throw new ForbiddenError("User not found");

    if (user.role === "mentor" && !user.isProfileSetup) {
      throw new ForbiddenError("Please complete your profile setup before accessing the dashboard");
    }

    next();
  } catch (err) {
    next(err);
  }
}