import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearReminder,
  completeReminder,
  createStandaloneReminder,
  dismissReminder,
  getReminders,
  removeReminder as removeReminderService,
  setReminder,
  snoozeReminder,
  updateReminder as updateReminderService,
  type ReminderItem,
  type ReminderUpdate,
} from '@/services/reminderService';
import { isOverdue, isToday } from '@/utils/reminderTime';
import type { ReminderRepeat } from '@/types/note';

export const useReminders = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const items = await getReminders();
      setReminders(items);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pending = useMemo(() => reminders.filter((reminder) => reminder.state === 'pending'), [reminders]);

  // Reminders that need attention right now (overdue or due today)
  const dueCount = useMemo(
    () => pending.filter((reminder) => isToday(reminder.effectiveAt) || isOverdue(reminder.effectiveAt)).length,
    [pending]
  );

  const remindersByNoteId = useMemo(() => {
    const map: Record<string, ReminderItem> = {};
    reminders.forEach((reminder) => {
      if (reminder.noteId) map[reminder.noteId] = reminder;
    });
    return map;
  }, [reminders]);

  const saveReminder = async (noteId: string, remindAt: string, repeat: ReminderRepeat = 'none') => {
    await setReminder(noteId, remindAt, repeat);
    await refresh();
  };

  const clearNoteReminder = async (noteId: string) => {
    await clearReminder(noteId);
    await refresh();
  };

  const addReminder = async (title: string, remindAt: string, repeat: ReminderRepeat = 'none') => {
    await createStandaloneReminder(title, remindAt, repeat);
    await refresh();
  };

  const editReminder = async (reminder: ReminderItem, updates: ReminderUpdate) => {
    await updateReminderService(reminder, updates);
    await refresh();
  };

  const removeReminder = async (reminder: ReminderItem) => {
    await removeReminderService(reminder);
    await refresh();
  };

  const snooze = async (reminder: ReminderItem, minutes: number) => {
    await snoozeReminder(reminder, minutes);
    await refresh();
  };

  const complete = async (reminder: ReminderItem) => {
    await completeReminder(reminder);
    await refresh();
  };

  const dismiss = async (reminder: ReminderItem) => {
    await dismissReminder(reminder);
    await refresh();
  };

  return {
    reminders,
    pending,
    dueCount,
    remindersByNoteId,
    loading,
    refresh,
    saveReminder,
    clearNoteReminder,
    addReminder,
    editReminder,
    removeReminder,
    snooze,
    complete,
    dismiss,
  };
};
