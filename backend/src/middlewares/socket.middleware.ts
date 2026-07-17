import { Socket, ExtendedError } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.util";
import User from "../models/user.model";
import { SocketData, ClientToServerEvents, ServerToClientEvents } from "../types/socket.type";

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

// Minimal same-name cookie extractor — avoids pulling in a new dependency
// just to read one value out of the raw Cookie header. Socket.IO's initial
// handshake is a real HTTP request, so browser-set cookies (including
// httpOnly ones, which client-side JS can never read) are already present
// on socket.handshake.headers.cookie automatically, as long as the client
// connects with withCredentials: true and the server's CORS config allows
// credentials for that origin (it does — see index.ts).
function extractCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export async function socketAuthMiddleware(socket: AppSocket, next: (err?: ExtendedError) => void) {
  try {
    // --- CHANGED: was reading socket.handshake.auth.token, which required
    // the client to supply the JWT itself. That's incompatible with the
    // httpOnly cookie the token actually lives in (client JS can't read it
    // by design), so this always failed silently after the cookie
    // migration — sockets never authenticated. Reading it from the
    // handshake's Cookie header instead keeps the token out of client JS
    // entirely, matching how the REST `protect` middleware already works.
    const token = extractCookie(socket.handshake.headers.cookie, "token");

    if (!token) {
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