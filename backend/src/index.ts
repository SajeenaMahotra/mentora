// index.ts
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { connectDatabase } from "./database/connection";
import { env } from "./config/env";
import logger from "./config/logger";
import { registerChatHandlers, AppServer } from "./sockets/chat.gateway";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  const httpServer = http.createServer(app);

  const io: AppServer = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    maxHttpBufferSize: 1e5, // 100kb
  });

  registerChatHandlers(io);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`Mentora API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    io.close();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", { reason });
  });
}

bootstrap();