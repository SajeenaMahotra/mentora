// sockets/chat.gateway.ts
import { Server } from "socket.io";
import { socketAuthMiddleware, AppSocket } from "../middlewares/socket.middleware";
import { conversationService } from "../services/conversation.service";
import { conversationRepository } from "../repositories/conversation.repository";
import { messageService } from "../services/message.service";
import { joinConversationSchema, sendMessageSchema } from "../dtos/chat.dto";
import { isRateLimited, clearRateLimit } from "../utils/socketRateLimiter";
import { SocketData, ClientToServerEvents, ServerToClientEvents } from "../types/socket.type";
import logger from "../config/logger";

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>;

function personalRoom(userId: string) {
  return `user:${userId}`;
}

export function registerChatHandlers(io: AppServer) {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: AppSocket) => {
    const userId = socket.data.user.id;
    socket.join(personalRoom(userId));
    logger.debug(`Socket connected: ${socket.id}`, { userId });

    socket.on("join_conversation", async (payload, callback) => {
      try {
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
      if (typeof payload?.conversationId === "string" && socket.rooms.has(payload.conversationId)) {
        socket.to(payload.conversationId).emit("typing", { userId });
      }
    });

    socket.on("stop_typing", (payload) => {
      if (typeof payload?.conversationId === "string" && socket.rooms.has(payload.conversationId)) {
        socket.to(payload.conversationId).emit("stop_typing", { userId });
      }
    });

    socket.on("mark_read", async (payload, callback) => {
      try {
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