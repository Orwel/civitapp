import type { ChatMessage, ChatThread } from "@/core/entities/Chat";
import type { IChatRepository } from "@/core/repositories/IChatRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseChatRepository implements IChatRepository {
  constructor(private supabase: SupabaseClient) {}

  async createDefaultThread(actionId: string): Promise<ChatThread> {
    const { data, error } = await this.supabase
      .from("action_chat_threads")
      .insert({ action_id: actionId, title: "General", is_default: true })
      .select()
      .single();
    if (error) throw error;
    return data as ChatThread;
  }

  async createThread(actionId: string, title: string): Promise<ChatThread> {
    const { data, error } = await this.supabase
      .from("action_chat_threads")
      .insert({ action_id: actionId, title, is_default: false })
      .select()
      .single();
    if (error) throw error;
    return data as ChatThread;
  }

  async getThreads(actionId: string): Promise<ChatThread[]> {
    const { data, error } = await this.supabase
      .from("action_chat_threads")
      .select("*")
      .eq("action_id", actionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ChatThread[];
  }

  async getMessages(threadId: string, limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("action_chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ChatMessage[];
  }

  async sendMessage(
    threadId: string,
    actionId: string,
    senderId: string,
    message: string
  ): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from("action_chat_messages")
      .insert({
        thread_id: threadId,
        action_id: actionId,
        sender_id: senderId,
        message,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ChatMessage;
  }
}
