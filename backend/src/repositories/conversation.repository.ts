import Conversation, { IConversation } from "../models/conversation.model";

export const conversationRepository = {
  findByParticipants(learnerId: string, mentorId: string) {
    return Conversation.findOne({ learner: learnerId, mentor: mentorId });
  },

  findById(id: string) {
    return Conversation.findById(id);
  },

  create(learnerId: string, mentorId: string) {
    return Conversation.create({ learner: learnerId, mentor: mentorId });
  },

  // Race-safe find-or-create: relies on the unique (learner, mentor) index.
  // If two requests hit at once, the second insert throws E11000 and we
  // just re-fetch instead of creating a duplicate.
  async findOrCreate(learnerId: string, mentorId: string): Promise<IConversation> {
    const existing = await this.findByParticipants(learnerId, mentorId);
    if (existing) return existing;

    try {
      return await this.create(learnerId, mentorId);
    } catch (err: any) {
      if (err.code === 11000) {
        const conversation = await this.findByParticipants(learnerId, mentorId);
        if (conversation) return conversation;
      }
      throw err;
    }
  },

  updateLastMessage(id: string, preview: string, sentAt: Date) {
    return Conversation.findByIdAndUpdate(id, {
      lastMessageAt: sentAt,
      lastMessagePreview: preview,
    });
  },

  findForUser(userId: string) {
    return Conversation.find({
      $or: [{ learner: userId }, { mentor: userId }],
    })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .populate("learner", "fullname profilePhoto")
      .populate("mentor", "fullname profilePhoto");
  },

  isParticipant(conversation: IConversation, userId: string): boolean {
    return conversation.learner.toString() === userId || conversation.mentor.toString() === userId;
  },
};