import mongoose from "mongoose";
import { env } from "../config/env";
import logger from "../config/logger";

mongoose.set("strictQuery", true);

// mongoose.set("sanitizeFilter", true);

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info("MongoDB connected", { host: mongoose.connection.host });
  } catch (err) {
    logger.error("MongoDB connection failed", { error: (err as Error).message });
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export default mongoose;
