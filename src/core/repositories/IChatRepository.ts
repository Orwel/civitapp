import type { ChatMessage, ChatThread } from "@/core/entities/Chat";

export interface IChatRepository {
  createDefaultThread(actionId: string): Promise<ChatThread>;
  createThread(actionId: string, title: string): Promise<ChatThread>;
  getThreads(actionId: string): Promise<ChatThread[]>;
  getMessages(threadId: string, limit?: number): Promise<ChatMessage[]>;
  sendMessage(
    threadId: string,
    actionId: string,
    senderId: string,
    message: string
  ): Promise<ChatMessage>;
}
