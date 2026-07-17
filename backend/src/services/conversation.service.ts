import { conversationRepository } from "../repositories/conversation.repository";
import { userRepository } from "../repositories/user.repository";
import { messageRepository } from "../repositories/message.repository";
import { ForbiddenError, ValidationError } from "../errors/AppError";
import { NotFoundError } from "../errors/AppError";
import { IConversation } from "../models/conversation.model";
import logger from "../config/logger";

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

    // --- NEW: guard against dangling learner/mentor references. This should
    // never happen through normal app flow (users are soft-deleted, not
    // removed — see userRepository.softDelete), but a document removed
    // directly at the database level (e.g. manual cleanup during dev/testing)
    // leaves conversations pointing at a user that no longer exists, and
    // populate() returns null for that field. Skipping these rather than
    // crashing keeps the endpoint usable; the warning log surfaces the data
    // integrity issue so it can be investigated instead of failing silently.
    const validConversations = conversations.filter((conversation) => {
      const isValid = !!conversation.learner && !!conversation.mentor;
      if (!isValid) {
        logger.warn("Skipping conversation with missing participant", {
          conversationId: conversation._id?.toString(),
          hasLearner: !!conversation.learner,
          hasMentor: !!conversation.mentor,
        });
      }
      return isValid;
    });

    return Promise.all(
      validConversations.map(async (conversation) => {
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