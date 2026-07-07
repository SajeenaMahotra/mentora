import { AppServer } from "./chat.gateway";

let ioInstance: AppServer | null = null;

export function setIO(io: AppServer): void {
  ioInstance = io;
}

// Throws instead of returning null/undefined — a service calling this
// before bootstrap has completed is a startup-ordering bug, not a
// recoverable runtime state, so fail loud rather than silently no-op.
export function getIO(): AppServer {
  if (!ioInstance) {
    throw new Error("Socket.IO instance requested before initialization");
  }
  return ioInstance;
}

export function personalRoom(userId: string): string {
  return `user:${userId}`;
}