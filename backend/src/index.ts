// index.ts
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import { createApp } from "./app";
import { connectDatabase } from "./database/connection";
import { env, allowedOrigins } from "./config/env";
import logger from "./config/logger";
import { registerChatHandlers, AppServer } from "./sockets/chat.gateway";
import { setIO } from "./sockets/io.instance";

// --- NEW: TLS support. Transport confidentiality is enforced by serving the API
// over HTTPS rather than plain HTTP, so credentials, session cookies and booking
// data are encrypted in transit and cannot be read by a network-level observer.
// Certificates are locally trusted (mkcert) and deliberately kept out of the repo.
// If no certificate is configured the server falls back to HTTP, so the app still
// runs for anyone cloning the repo without generating certificates first.
function createServer(app: ReturnType<typeof createApp>) {
  const certPath = path.resolve(process.cwd(), env.TLS_CERT_PATH ?? "");
  const keyPath = path.resolve(process.cwd(), env.TLS_KEY_PATH ?? "");

  const tlsAvailable =
    !!env.TLS_CERT_PATH && !!env.TLS_KEY_PATH && fs.existsSync(certPath) && fs.existsSync(keyPath);

  if (!tlsAvailable) {
    logger.warn("TLS certificate not found — falling back to HTTP. Do not use this configuration in production.");
    return { server: http.createServer(app), secure: false };
  }

  const server = https.createServer(
    {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      // Floor the negotiated protocol at TLS 1.2 and prefer 1.3. Older versions
      // (TLS 1.0/1.1) are deprecated by RFC 8996 and are refused outright.
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.3",
    },
    app
  );

  return { server, secure: true };
}

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  const { server: httpServer, secure } = createServer(app);

  // Socket.IO attaches to the same server instance, so real-time chat and
  // notifications inherit the same TLS channel as the REST API (wss:// not ws://).
  const io: AppServer = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    maxHttpBufferSize: 1e5, // 100kb
  });

  setIO(io);
  registerChatHandlers(io);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`Mentora API listening on port ${env.PORT} over ${secure ? "HTTPS" : "HTTP"} [${env.NODE_ENV}]`);
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