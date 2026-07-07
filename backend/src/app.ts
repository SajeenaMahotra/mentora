import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";
import path from "path";
import rateLimit from "express-rate-limit";
import { env, isProd } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { sanitizeRequest } from "./middlewares/sanitize.middleware";
import logger from "./config/logger";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import packageRoutes from "./routes/package.routes";
import categoryRoutes from "./routes/category.routes";
import adminRoutes from "./routes/admin.routes";
import conversationRoutes from "./routes/conversation.routes";
import bookingRoutes from "./routes/booking.routes";
import notificationRoutes from "./routes/notification.routes";
import { stripeWebhook } from "./controllers/webhook.controller";

export function createApp(): Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "1d",
    index: false,
    dotfiles: "deny",
  }));

  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // --- Stripe webhook: MUST come before express.json(), needs raw body for signature verification ---
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(compression());

  app.use(sanitizeRequest);

  app.use(hpp());

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: "Too many requests, please try again later." },
    })
  );

  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`, { ip: req.ip });
    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "Mentora API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/packages", packageRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/conversations", conversationRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}