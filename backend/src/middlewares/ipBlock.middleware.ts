import { Request, Response, NextFunction } from "express";
import { isIpBlocked } from "../utils/ipTracker.util";
import { ForbiddenError } from "../errors/AppError";

export function checkIpNotBlocked(req: Request, _res: Response, next: NextFunction) {
  if (isIpBlocked(req.ip as string)) {
    return next(new ForbiddenError("Too many failed attempts from this network. Please try again later."));
  }
  next();
}