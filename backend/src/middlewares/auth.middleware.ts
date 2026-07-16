import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { UnauthorizedError, ForbiddenError } from "../errors/AppError";
import { UserRole } from "../types/user.type";
import User from "../models/user.model";
import { hashUserAgent } from "../utils/crypto.util";

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    // --- CHANGED: token now comes from the httpOnly cookie, not the Authorization header.
    const token = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedError("Missing or invalid session");
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select(
      "+tokenValidAfter +sessionUserAgentHash status isDeleted"
    );
    if (!user || user.isDeleted) {
      throw new UnauthorizedError("Invalid or expired token");
    }
    if (user.status === "suspended") {
      throw new UnauthorizedError("Account suspended");
    }
    if (user.tokenValidAfter) {
      const issuedAt = payload.iat! * 1000; // JWT iat is in seconds
      if (issuedAt < user.tokenValidAfter.getTime()) {
        throw new UnauthorizedError("Session no longer valid");
      }
    }

    if (user.sessionUserAgentHash) {
      const currentHash = hashUserAgent(req.headers["user-agent"] || "");
      if (currentHash !== user.sessionUserAgentHash) {
        throw new UnauthorizedError("Session bound to a different device");
      }
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function restrictTo(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("You do not have permission to perform this action"));
    }
    next();
  };
}