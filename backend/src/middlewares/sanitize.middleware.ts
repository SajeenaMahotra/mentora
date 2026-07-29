import { Request, Response, NextFunction } from "express";

// Recursively strips any key starting with "$" or containing "." from user input,
// neutralising MongoDB operator injection (e.g. {"email": {"$ne": null}}) before
// it can reach a Mongoose query.
function sanitizeObject(obj: any): void {
  if (!obj || typeof obj !== "object") return;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  }
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query); // mutated in place only — never reassigned (Express 5 read-only getter)
  next();
}




