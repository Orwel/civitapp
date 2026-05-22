import type { ActionAttachment } from "@/core/entities/Attachment";

export interface IAttachmentRepository {
  create(data: {
    action_id: string;
    uploaded_by: string;
    bucket: string;
    storage_path: string;
    file_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    sha256?: string | null;
  }): Promise<ActionAttachment>;
  getByAction(actionId: string): Promise<ActionAttachment[]>;
}
