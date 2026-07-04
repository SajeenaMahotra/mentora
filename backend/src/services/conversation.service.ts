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
  async startConversation(learnerId: string, mentorId: string): Promise<IConversation> {
    if (learnerId === mentorId) {
      throw new ValidationError("You cannot message yourself");
    }

    const learner = await userRepository.findById(learnerId);
    if (!learner || learner.isDeleted) {
      throw new NotFoundError("Learner account not found");
    }
    if (learner.role !== "learner") {
      throw new ForbiddenError("Only learners can start a conversation");
    }

    const mentor = await userRepository.findById(mentorId);
    if (!mentor || mentor.isDeleted) {
      throw new NotFoundError("Mentor not found");
    }
    if (mentor.role !== "mentor") {
      throw new ValidationError("Target user is not a mentor");
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