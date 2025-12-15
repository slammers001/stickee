import { ReactionSummary } from './emojiReaction';

export type NoteStatus = 'To-Do' | 'Doing' | 'Done' | 'Backlog';

export interface Note {
  id: string;
  title?: string;
  content: string;
  color: string;
  status: NoteStatus;
  lastUpdated: number;
  last_updated?: number; // For Supabase compatibility
  pinned: boolean;
  user_id?: string; // Made optional
  created_at?: string; // For Supabase compatibility
  reactions?: ReactionSummary[]; // Optional array of reaction summaries
}

export type StickyNoteStatus = NoteStatus;
