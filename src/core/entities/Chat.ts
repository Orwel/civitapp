export interface ChatThread {
  id: string;
  action_id: string;
  title: string | null;
  is_default: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  action_id: string;
  sender_id: string;
  message: string;
  attachments: AttachmentRef[];
  reply_to_id?: string | null;
  created_at: string;
  sender_name?: string | null;
}

export interface AttachmentRef {
  attachment_id: string;
  file_name: string;
  storage_path?: string;
}
