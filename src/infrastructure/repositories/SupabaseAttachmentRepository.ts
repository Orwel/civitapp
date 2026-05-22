import type { ActionAttachment } from "@/core/entities/Attachment";
import type { IAttachmentRepository } from "@/core/repositories/IAttachmentRepository";
import type { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAttachmentRepository implements IAttachmentRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: {
    action_id: string;
    uploaded_by: string;
    bucket: string;
    storage_path: string;
    file_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    sha256?: string | null;
  }): Promise<ActionAttachment> {
    const { data: row, error } = await this.supabase
      .from("action_attachments")
      .insert({
        action_id: data.action_id,
        uploaded_by: data.uploaded_by,
        bucket: data.bucket,
        storage_path: data.storage_path,
        file_name: data.file_name,
        mime_type: data.mime_type ?? null,
        size_bytes: data.size_bytes ?? null,
        sha256: data.sha256 ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return row as ActionAttachment;
  }

  async getByAction(actionId: string): Promise<ActionAttachment[]> {
    const { data, error } = await this.supabase
      .from("action_attachments")
      .select("*")
      .eq("action_id", actionId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ActionAttachment[];
  }
}
