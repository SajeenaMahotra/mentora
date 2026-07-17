import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";

let socket: Socket | null = null;

// --- CHANGED: the JWT lives in an httpOnly cookie now, which client-side JS
// can never read (that's the entire point of httpOnly — it blocks XSS token
// theft). The previous version read localStorage.getItem("token"), which no
// longer exists anywhere in the app post-cookie-migration — so this always
// returned null and sockets never connected. Socket.IO's handshake is a real
// HTTP request, so the browser attaches the cookie automatically as long as
// withCredentials is set here and the server's CORS config allows
// credentials for this origin (it does — see backend index.ts). No
// client-side token handling needed or possible.
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  if (socket && socket.connected) {
    return socket;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: false,
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}