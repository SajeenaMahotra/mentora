// conversation.service.ts
import { conversationRepository } from "../repositories/conversation.repository";
import { userRepository } from "../repositories/user.repository";
import { messageRepository } from "../repositories/message.repository";
import { ForbiddenError, ValidationError } from "../errors/AppError";
import { NotFoundError } from "../errors/AppError";
import { IConversation } from "../models/conversation.model";

export const conversationService = {
  // Learner-only. Route already applies restrictTo("learner"), but this
  // check is repeated here because the socket layer has no route
  // middleware to rely on — defense in depth per assignment requirement.
  async startConversation(userId: string, targetId: string): Promise<IConversation> {
    if (userId === targetId) {
      throw new ValidationError("You cannot message yourself");
    }

    const user = await userRepository.findById(userId);
    if (!user || user.isDeleted) {
      throw new NotFoundError("Account not found");
    }

    const target = await userRepository.findById(targetId);
    if (!target || target.isDeleted) {
      throw new NotFoundError("User not found");
    }

    // one side must be learner, the other mentor — figure out which is which
    let learnerId: string, mentorId: string;
    if (user.role === "learner" && target.role === "mentor") {
      learnerId = userId;
      mentorId = targetId;
    } else if (user.role === "mentor" && target.role === "learner") {
      learnerId = targetId;
      mentorId = userId;
    } else {
      throw new ForbiddenError("Conversations can only happen between a learner and a mentor");
    }

    return conversationRepository.findOrCreate(learnerId, mentorId);
  },

  async listConversations(userId: string) {
    const conversations = await conversationRepository.findForUser(userId);

    return Promise.all(
      conversations.map(async (conversation) => {
        const other =
          conversation.learner._id.toString() === userId ? conversation.mentor : conversation.learner;

        const unreadCount = await messageRepository.countUnread(conversation._id.toString(), userId);

        return {
          id: conversation._id,
          participant: other,
          lastMessageAt: conversation.lastMessageAt,
          lastMessagePreview: conversation.lastMessagePreview,
          unreadCount,
        };
      })
    );
  },

  // Fetches the conversation and confirms the requesting user is a
  // participant. Shared by the REST history endpoint and the socket
  // join_conversation handler — a valid JWT proves identity, not
  // membership in this specific thread.
  async getAuthorizedConversation(conversationId: string, userId: string): Promise<IConversation> {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    if (!conversationRepository.isParticipant(conversation, userId)) {
      throw new ForbiddenError("You are not a participant in this conversation");
    }
    return conversation;
  },
};