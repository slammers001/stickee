export interface NoteAttachment {
  id: string;
  note_id: string;
  user_id: string;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  created_at: string;
  url?: string;
}

export type PendingAttachment = File;

