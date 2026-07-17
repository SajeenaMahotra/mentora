import { Server } from "socket.io";
import { socketAuthMiddleware, AppSocket } from "../middlewares/socket.middleware";
import { conversationService } from "../services/conversation.service";
import { conversationRepository } from "../repositories/conversation.repository";
import { messageService } from "../services/message.service";
import { joinConversationSchema, sendMessageSchema } from "../dtos/chat.dto";
import { isRateLimited, clearRateLimit, checkRateLimit } from "../utils/socketRateLimiter";
import { SocketData, ClientToServerEvents, ServerToClientEvents } from "../types/socket.type";
import logger from "../config/logger";

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

function personalRoom(userId: string) {
  return `user:${userId}`;
}

// --- NEW: separate, independent budgets per event type. typing/stop_typing
// are naturally high-frequency (fired on every keystroke pause) so they get
// a looser window than the others; join/leave/mark_read are occasional user
// actions, not per-keystroke, so a tighter window is appropriate without
// affecting normal usage.
const RATE_LIMITS = {
  join_conversation: { max: 10, windowMs: 10_000 },
  leave_conversation: { max: 20, windowMs: 10_000 },
  typing: { max: 20, windowMs: 5_000 },
  stop_typing: { max: 20, windowMs: 5_000 },
  mark_read: { max: 20, windowMs: 10_000 },
} as const;

export function registerChatHandlers(io: AppServer) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: AppSocket) => {
    const userId = socket.data.user.id;
    socket.join(personalRoom(userId));
    logger.debug(`Socket connected: ${socket.id}`, { userId });

    socket.on("join_conversation", async (payload, callback) => {
      try {
        if (checkRateLimit(`join_conversation:${userId}`, RATE_LIMITS.join_conversation.max, RATE_LIMITS.join_conversation.windowMs)) {
          return callback({ success: false, message: "Too many requests, slow down" });
        }

        const parsed = joinConversationSchema.safeParse(payload);
        if (!parsed.success) {
          return callback({ success: false, message: "Invalid conversation id" });
        }
        await conversationService.getAuthorizedConversation(parsed.data.conversationId, userId);
        socket.join(parsed.data.conversationId);
        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, message: err.message ?? "Unable to join conversation" });
      }
    });

    socket.on("leave_conversation", (payload) => {
      if (checkRateLimit(`leave_conversation:${userId}`, RATE_LIMITS.leave_conversation.max, RATE_LIMITS.leave_conversation.windowMs)) {
        return;
      }
      if (typeof payload?.conversationId === "string") socket.leave(payload.conversationId);
    });

    socket.on("send_message", async (payload, callback) => {
      try {
        if (isRateLimited(userId)) {
          return callback({ success: false, message: "Too many messages, slow down" });
        }

        const parsed = sendMessageSchema.safeParse(payload);
        if (!parsed.success) {
          return callback({ success: false, message: parsed.error.issues[0]?.message ?? "Invalid message" });
        }

        const message = await messageService.sendMessage(
          parsed.data.conversationId,
          userId,
          parsed.data.content
        );

        io.to(parsed.data.conversationId).emit("new_message", message);

        const conversation = await conversationRepository.findById(parsed.data.conversationId);
        if (conversation) {
          const populated = await conversation.populate([
            { path: "learner", select: "fullname profilePhoto" },
            { path: "mentor", select: "fullname profilePhoto" },
          ]);

          const learner: any = populated.learner;
          const mentor: any = populated.mentor;
          const preview = parsed.data.content.slice(0, 200);
          const lastMessageAt = new Date().toISOString();

          io.to(personalRoom(learner._id.toString())).emit("conversation_updated", {
            conversationId: parsed.data.conversationId,
            participant: { _id: mentor._id.toString(), fullname: mentor.fullname, profilePhoto: mentor.profilePhoto },
            lastMessageAt,
            lastMessagePreview: preview,
            senderId: userId,
          });

          io.to(personalRoom(mentor._id.toString())).emit("conversation_updated", {
            conversationId: parsed.data.conversationId,
            participant: { _id: learner._id.toString(), fullname: learner.fullname, profilePhoto: learner.profilePhoto },
            lastMessageAt,
            lastMessagePreview: preview,
            senderId: userId,
          });
        }

        callback({ success: true, data: message });
      } catch (err: any) {
        callback({ success: false, message: err.message ?? "Unable to send message" });
      }
    });

    socket.on("typing", (payload) => {
      if (checkRateLimit(`typing:${userId}`, RATE_LIMITS.typing.max, RATE_LIMITS.typing.windowMs)) {
        return;
      }
      if (typeof payload?.conversationId === "string" && socket.rooms.has(payload.conversationId)) {
        socket.to(payload.conversationId).emit("typing", { userId });
      }
    });

    socket.on("stop_typing", (payload) => {
      if (checkRateLimit(`stop_typing:${userId}`, RATE_LIMITS.stop_typing.max, RATE_LIMITS.stop_typing.windowMs)) {
        return;
      }
      if (typeof payload?.conversationId === "string" && socket.rooms.has(payload.conversationId)) {
        socket.to(payload.conversationId).emit("stop_typing", { userId });
      }
    });

    socket.on("mark_read", async (payload, callback) => {
      try {
        if (checkRateLimit(`mark_read:${userId}`, RATE_LIMITS.mark_read.max, RATE_LIMITS.mark_read.windowMs)) {
          return callback({ success: false, message: "Too many requests, slow down" });
        }

        if (typeof payload?.conversationId !== "string") {
          return callback({ success: false, message: "Invalid conversation id" });
        }
        await messageService.markThreadRead(payload.conversationId, userId);
        socket.to(payload.conversationId).emit("thread_read", { conversationId: payload.conversationId, userId });
        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, message: err.message ?? "Unable to mark read" });
      }
    });

    socket.on("disconnect", () => {
      clearRateLimit(userId);
      logger.debug(`Socket disconnected: ${socket.id}`, { userId });
    });
  });
}