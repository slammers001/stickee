import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import { decryptContent, decryptTitle, encryptTitle } from '@/utils/encryption';
import { effectiveReminderTime, nextOccurrence } from '@/utils/reminderTime';
import type { ReminderRepeat, ReminderState } from '@/types/note';

export type ReminderSource = 'note' | 'standalone';

export interface ReminderItem {
  /** Unique reminder id - the note id for note reminders, the reminders row id otherwise. */
  id: string;
  /** Set when the reminder belongs to a note. */
  noteId: string | null;
  source: ReminderSource;
  title?: string;
  content: string;
  remindAt: string;
  repeat: ReminderRepeat;
  state: ReminderState;
  firedAt: string | null;
  snoozedUntil: string | null;
  effectiveAt: string;
}

export interface ReminderUpdate {
  title?: string;
  remindAt?: string;
  repeat?: ReminderRepeat;
}

export const MISSING_REMINDER_SETUP_MESSAGE =
  'Reminders are not set up yet. Run supabase/migrations/add_note_reminders.sql in your Supabase SQL editor.';

export const MISSING_STANDALONE_REMINDER_SETUP_MESSAGE =
  'Standalone reminders are not set up yet. Run supabase/migrations/add_standalone_reminders.sql in your Supabase SQL editor.';

const isMissingColumnError = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message || '');
  return code === '42703' || message.includes('remind_at') || message.includes('remind_repeat');
};

const isMissingTableError = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message || '');
  return code === '42P01' || message.includes('relation "public.reminders"') || message.includes('relation "reminders"');
};

interface ReminderRow {
  id: string;
  title?: string | null;
  content?: string | null;
  remind_at: string;
  remind_repeat?: string | null;
  remind_state?: string | null;
  remind_fired_at?: string | null;
  remind_snoozed_until?: string | null;
}

const mapReminder = (note: ReminderRow): ReminderItem => {
  const remindAt = note.remind_at;
  const snoozedUntil = note.remind_snoozed_until || null;

  return {
    id: note.id,
    noteId: note.id,
    source: 'note',
    title: decryptTitle(note.title ?? undefined),
    content: decryptContent(note.content || ''),
    remindAt,
    repeat: (note.remind_repeat as ReminderRepeat) || 'none',
    state: (note.remind_state as ReminderState) || 'pending',
    firedAt: note.remind_fired_at || null,
    snoozedUntil,
    effectiveAt: effectiveReminderTime(remindAt, snoozedUntil) || remindAt,
  };
};

const mapStandaloneReminder = (reminder: ReminderRow): ReminderItem => {
  const remindAt = reminder.remind_at;
  const snoozedUntil = reminder.remind_snoozed_until || null;

  return {
    id: reminder.id,
    noteId: null,
    source: 'standalone',
    title: decryptTitle(reminder.title ?? undefined),
    content: '',
    remindAt,
    repeat: (reminder.remind_repeat as ReminderRepeat) || 'none',
    state: (reminder.remind_state as ReminderState) || 'pending',
    firedAt: reminder.remind_fired_at || null,
    snoozedUntil,
    effectiveAt: effectiveReminderTime(remindAt, snoozedUntil) || remindAt,
  };
};

/**
 * A reminder is due when its effective time has passed, it has not been
 * completed or dismissed, and it has not already fired since the last snooze.
 */
const isDue = (reminder: ReminderItem, now: Date): boolean => {
  if (reminder.state !== 'pending') return false;
  if (new Date(reminder.effectiveAt).getTime() > now.getTime()) return false;

  if (!reminder.firedAt) return true;

  // Already fired - it only becomes due again after being snoozed.
  if (!reminder.snoozedUntil) return false;
  return new Date(reminder.snoozedUntil).getTime() > new Date(reminder.firedAt).getTime();
};

/** All reminders for the current user (archived and trashed notes excluded). */
export const getReminders = async (): Promise<ReminderItem[]> => {
  try {
    const userId = await getUserId();

    const [notesResult, standaloneResult] = await Promise.all([
      supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .is('deleted_at', null)
        .not('remind_at', 'is', null),
      supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId),
    ]);

    const items: ReminderItem[] = [];

    if (notesResult.error) {
      if (!isMissingColumnError(notesResult.error)) throw notesResult.error;
      console.warn(MISSING_REMINDER_SETUP_MESSAGE);
    } else {
      items.push(...(notesResult.data || []).map(mapReminder));
    }

    if (standaloneResult.error) {
      if (!isMissingTableError(standaloneResult.error)) throw standaloneResult.error;
      console.warn(MISSING_STANDALONE_REMINDER_SETUP_MESSAGE);
    } else {
      items.push(...(standaloneResult.data || []).map(mapStandaloneReminder));
    }

    return items.sort(
      (a, b) => new Date(a.effectiveAt).getTime() - new Date(b.effectiveAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
};

/** Reminders that should fire right now. */
export const getDueReminders = async (now: Date = new Date()): Promise<ReminderItem[]> => {
  const reminders = await getReminders();
  return reminders.filter((reminder) => isDue(reminder, now));
};

const updateReminderColumns = async (
  noteId: string,
  updates: Record<string, unknown>
): Promise<void> => {
  const userId = await getUserId();

  const { error } = await supabase
    .from('notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    if (isMissingColumnError(error)) {
      throw new Error(MISSING_REMINDER_SETUP_MESSAGE);
    }
    throw error;
  }
};

const updateStandaloneColumns = async (
  id: string,
  updates: Record<string, unknown>
): Promise<void> => {
  const userId = await getUserId();

  const { error } = await supabase
    .from('reminders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(MISSING_STANDALONE_REMINDER_SETUP_MESSAGE);
    }
    throw error;
  }
};

const updateReminderRecord = async (
  reminder: ReminderItem,
  updates: Record<string, unknown>
): Promise<void> => {
  if (reminder.source === 'note' && reminder.noteId) {
    await updateReminderColumns(reminder.noteId, updates);
    return;
  }
  await updateStandaloneColumns(reminder.id, updates);
};

/** Set (or replace) the reminder on a note. */
export const setReminder = async (
  noteId: string,
  remindAt: string,
  repeat: ReminderRepeat = 'none'
): Promise<void> => {
  await updateReminderColumns(noteId, {
    remind_at: remindAt,
    remind_repeat: repeat,
    remind_state: 'pending',
    remind_fired_at: null,
    remind_snoozed_until: null,
  });
};

/** Create a reminder that is not attached to a note. */
export const createStandaloneReminder = async (
  title: string,
  remindAt: string,
  repeat: ReminderRepeat = 'none'
): Promise<void> => {
  const userId = await getUserId();
  const trimmedTitle = title.trim();

  const { error } = await supabase
    .from('reminders')
    .insert([{
      user_id: userId,
      title: trimmedTitle ? encryptTitle(trimmedTitle) : null,
      remind_at: remindAt,
      remind_repeat: repeat,
      remind_state: 'pending',
    }]);

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(MISSING_STANDALONE_REMINDER_SETUP_MESSAGE);
    }
    throw error;
  }
};

/** Edit a reminder's text, time, or repeat setting. */
export const updateReminder = async (
  reminder: ReminderItem,
  updates: ReminderUpdate
): Promise<void> => {
  if (reminder.source === 'note') {
    if (!updates.remindAt) return;
    await setReminder(reminder.noteId as string, updates.remindAt, updates.repeat ?? reminder.repeat);
    return;
  }

  const payload: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    const trimmedTitle = updates.title.trim();
    payload.title = trimmedTitle ? encryptTitle(trimmedTitle) : null;
  }

  if (updates.remindAt !== undefined) {
    payload.remind_at = updates.remindAt;
    payload.remind_state = 'pending';
    payload.remind_fired_at = null;
    payload.remind_snoozed_until = null;
  }

  if (updates.repeat !== undefined) {
    payload.remind_repeat = updates.repeat;
    payload.remind_state = 'pending';
    payload.remind_fired_at = null;
    payload.remind_snoozed_until = null;
  }

  await updateStandaloneColumns(reminder.id, payload);
};

/** Remove the reminder from a note. */
export const clearReminder = async (noteId: string): Promise<void> => {
  await updateReminderColumns(noteId, {
    remind_at: null,
    remind_repeat: 'none',
    remind_state: 'pending',
    remind_fired_at: null,
    remind_snoozed_until: null,
  });
};

/** Delete a standalone reminder row. */
export const deleteStandaloneReminder = async (id: string): Promise<void> => {
  const userId = await getUserId();

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    if (isMissingTableError(error)) {
      throw new Error(MISSING_STANDALONE_REMINDER_SETUP_MESSAGE);
    }
    throw error;
  }
};

/** Remove any reminder, whether it belongs to a note or stands alone. */
export const removeReminder = async (reminder: ReminderItem): Promise<void> => {
  if (reminder.source === 'note' && reminder.noteId) {
    await clearReminder(reminder.noteId);
    return;
  }
  await deleteStandaloneReminder(reminder.id);
};

/** Record that a reminder just fired. */
export const markFired = async (reminder: ReminderItem): Promise<void> => {
  await updateReminderRecord(reminder, {
    remind_fired_at: new Date().toISOString(),
    remind_snoozed_until: null,
  });
};

/** Push a reminder back by the given number of minutes. */
export const snoozeReminder = async (reminder: ReminderItem, minutes: number): Promise<void> => {
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  await updateReminderRecord(reminder, {
    remind_snoozed_until: until,
  });
};

/**
 * Mark a reminder as done. Repeating reminders roll forward to their next
 * occurrence instead of being cleared.
 */
export const completeReminder = async (reminder: ReminderItem): Promise<void> => {
  if (reminder.repeat !== 'none') {
    const next = nextOccurrence(reminder.remindAt, reminder.repeat);
    await updateReminderRecord(reminder, {
      remind_at: next,
      remind_state: 'pending',
      remind_fired_at: null,
      remind_snoozed_until: null,
    });
    return;
  }

  await updateReminderRecord(reminder, {
    remind_state: 'completed',
    remind_fired_at: new Date().toISOString(),
    remind_snoozed_until: null,
  });
};

/** Dismiss a reminder without completing it. Repeating reminders roll forward. */
export const dismissReminder = async (reminder: ReminderItem): Promise<void> => {
  if (reminder.repeat !== 'none') {
    const next = nextOccurrence(reminder.remindAt, reminder.repeat);
    await updateReminderRecord(reminder, {
      remind_at: next,
      remind_state: 'pending',
      remind_fired_at: null,
      remind_snoozed_until: null,
    });
    return;
  }

  await updateReminderRecord(reminder, {
    remind_state: 'dismissed',
    remind_fired_at: new Date().toISOString(),
    remind_snoozed_until: null,
  });
};
