import { Socket, ExtendedError } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.util";
import User from "../models/user.model";
import { SocketData, ClientToServerEvents, ServerToClientEvents } from "../types/socket.type";

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

export async function socketAuthMiddleware(socket: AppSocket, next: (err?: ExtendedError) => void) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      return next(new Error("Missing authentication token"));
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub).select("+tokenValidAfter status isDeleted");
    if (!user || user.isDeleted) {
      return next(new Error("Invalid or expired token"));
    }
    if (user.status === "suspended") {
      return next(new Error("Account suspended"));
    }
    if (user.tokenValidAfter) {
      const issuedAt = payload.iat! * 1000;
      if (issuedAt < user.tokenValidAfter.getTime()) {
        return next(new Error("Session no longer valid"));
      }
    }

    socket.data.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}