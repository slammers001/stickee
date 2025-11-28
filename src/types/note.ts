export type NoteStatus = 'To-Do' | 'Doing' | 'Done' | 'Backlog';

export interface Note {
  id: string;
  content: string;
  color: string;
  status: NoteStatus;
  lastUpdated: number;
  pinned: boolean;
  user_id?: string;
}
