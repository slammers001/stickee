export interface NoteAttachment {
  id: string;
  note_id: string;
  user_id: string;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  created_at: string;
  /** Short-lived signed URL, generated when the attachment list is loaded. */
  url?: string;
}

export type PendingAttachment = File;
