import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import { decryptContent, decryptTitle } from '@/utils/encryption';
import { effectiveReminderTime, nextOccurrence } from '@/utils/reminderTime';
import type { ReminderRepeat, ReminderState } from '@/types/note';

export interface ReminderItem {
  noteId: string;
  title?: string;
  content: string;
  remindAt: string;
  repeat: ReminderRepeat;
  state: ReminderState;
  firedAt: string | null;
  snoozedUntil: string | null;
  effectiveAt: string;
}

export const MISSING_REMINDER_SETUP_MESSAGE =
  'Reminders are not set up yet. Run supabase/migrations/add_note_reminders.sql in your Supabase SQL editor.';

const isMissingColumnError = (error: unknown): boolean => {
  const code = (error as { code?: string })?.code;
  const message = String((error as { message?: string })?.message || '');
  return code === '42703' || message.includes('remind_at') || message.includes('remind_repeat');
};

const mapReminder = (note: any): ReminderItem => {
  const remindAt = note.remind_at as string;
  const snoozedUntil = (note.remind_snoozed_until as string | null) || null;

  return {
    noteId: note.id,
    title: decryptTitle(note.title),
    content: decryptContent(note.content),
    remindAt,
    repeat: (note.remind_repeat as ReminderRepeat) || 'none',
    state: (note.remind_state as ReminderState) || 'pending',
    firedAt: (note.remind_fired_at as string | null) || null,
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

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .is('deleted_at', null)
      .not('remind_at', 'is', null);

    if (error) {
      if (isMissingColumnError(error)) {
        console.warn(MISSING_REMINDER_SETUP_MESSAGE);
        return [];
      }
      throw error;
    }

    return (data || []).map(mapReminder);
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

/** Record that a reminder just fired. */
export const markFired = async (noteId: string): Promise<void> => {
  await updateReminderColumns(noteId, {
    remind_fired_at: new Date().toISOString(),
    remind_snoozed_until: null,
  });
};

/** Push a reminder back by the given number of minutes. */
export const snoozeReminder = async (noteId: string, minutes: number): Promise<void> => {
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  await updateReminderColumns(noteId, {
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
    await updateReminderColumns(reminder.noteId, {
      remind_at: next,
      remind_state: 'pending',
      remind_fired_at: null,
      remind_snoozed_until: null,
    });
    return;
  }

  await updateReminderColumns(reminder.noteId, {
    remind_state: 'completed',
    remind_fired_at: new Date().toISOString(),
    remind_snoozed_until: null,
  });
};

/** Dismiss a reminder without completing it. Repeating reminders roll forward. */
export const dismissReminder = async (reminder: ReminderItem): Promise<void> => {
  if (reminder.repeat !== 'none') {
    const next = nextOccurrence(reminder.remindAt, reminder.repeat);
    await updateReminderColumns(reminder.noteId, {
      remind_at: next,
      remind_state: 'pending',
      remind_fired_at: null,
      remind_snoozed_until: null,
    });
    return;
  }

  await updateReminderColumns(reminder.noteId, {
    remind_state: 'dismissed',
    remind_fired_at: new Date().toISOString(),
    remind_snoozed_until: null,
  });
};
