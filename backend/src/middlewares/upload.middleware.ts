import multer from "multer";
import multerLib from "multer";
import path from "path";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { ValidationError } from "../errors/AppError";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile-photos");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".jpg";
        cb(null, `${crypto.randomUUID()}${safeExt}`);
    },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new ValidationError("Only JPG and PNG images are allowed"));
    }

    cb(null, true);
}

export const uploadProfilePhoto = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single("photo");


export function handleProfilePhotoUpload(req: Request, res: Response, next: NextFunction) {
    uploadProfilePhoto(req, res, (err: unknown) => {
        if (!err) return next();

        if (err instanceof multerLib.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return next(new ValidationError("Image must be under 2MB"));
            }
            return next(new ValidationError(err.message));
        }

        return next(err);
    });
}