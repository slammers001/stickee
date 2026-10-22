import { ReactionSummary } from './emojiReaction';

export type NoteStatus = 'To-Do' | 'Doing' | 'Done' | 'Backlog';

export type ReminderRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export type ReminderState = 'pending' | 'completed' | 'dismissed';

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
  archived?: boolean; // Whether the note is archived
  archived_at?: string; // When the note was archived
  deleted_at?: string; // When the note was moved to trash
  isTemp?: boolean; // Whether the note is a temporary placeholder
  remind_at?: string | null; // ISO UTC - when the reminder should fire
  remind_repeat?: ReminderRepeat; // How often it repeats
  remind_state?: ReminderState; // pending | completed | dismissed
  remind_fired_at?: string | null; // ISO UTC - last time it fired
  remind_snoozed_until?: string | null; // ISO UTC - snooze target
}

export type StickyNoteStatus = NoteStatus;
