import { Request, Response, NextFunction } from "express";
import { conversationService } from "../services/conversation.service";
import { messageService } from "../services/message.service";
import { startConversationSchema, getMessagesQuerySchema } from "../dtos/chat.dto";
import { ValidationError } from "../errors/AppError";

export async function startConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = startConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const conversation = await conversationService.startConversation(
      req.user!.id,
      parsed.data.mentorId
    );

    res.status(201).json({
      success: true,
      message: "Conversation ready",
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const conversations = await conversationService.listConversations(req.user!.id);

    res.status(200).json({
      success: true,
      message: "Conversations fetched",
      data: conversations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = getMessagesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid query");
    }

    const conversationId = req.params.id as string;
    const messages = await messageService.getMessages(
      conversationId,
      req.user!.id,
      parsed.data.before,
      parsed.data.limit
    );

    res.status(200).json({
      success: true,
      message: "Messages fetched",
      data: messages,
    });
  } catch (err) {
    next(err);
  }
}