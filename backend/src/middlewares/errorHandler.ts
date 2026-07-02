import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import logger from "../config/logger";
import { isProd } from "../config/env";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, stack: err.stack, path: req.path });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(("fields" in err && err.fields) ? { fields: (err as any).fields } : {}),
    });
  }

  // Mongoose validation errors
  if ((err as any)?.name === "ValidationError") {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
    });
  }

  // Mongoose duplicate key
  if ((err as any)?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
      code: "DUPLICATE_KEY",
    });
  }

  // JWT errors
  if ((err as any)?.name === "JsonWebTokenError" || (err as any)?.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
      code: "UNAUTHORIZED",
    });
  }

  const error = err as Error;
  logger.error("Unhandled error", { message: error?.message, stack: error?.stack, path: req.path });

  return res.status(500).json({
    success: false,
    message: isProd ? "Something went wrong" : error?.message || "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Route not found", code: "NOT_FOUND" });
}

/**
 * Wraps async route handlers so thrown/rejected errors reach errorHandler
 * without needing try/catch in every controller.
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
