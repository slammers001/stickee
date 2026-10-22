import type { ReminderRepeat } from '@/types/note';

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Convert an ISO UTC timestamp into the local value format used by
 * <input type="datetime-local">.
 */
export const toLocalInputValue = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Convert a <input type="datetime-local"> value (local wall clock time) into
 * an ISO UTC timestamp.
 */
export const fromLocalInputValue = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** True when the given timestamp falls on today's local date. */
export const isToday = (iso: string): boolean => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return sameDay(date, new Date());
};

/** True when the given timestamp falls on tomorrow's local date. */
export const isTomorrow = (iso: string): boolean => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return sameDay(date, tomorrow);
};

/** True when the given timestamp is in the past. */
export const isOverdue = (iso: string): boolean => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
};

/** Short time string, e.g. "3:30 PM". */
export const formatReminderTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

/** Human friendly date + time, e.g. "Today 3:30 PM" or "Thu 12 Sep 9:00 AM". */
export const formatReminderDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const time = formatReminderTime(iso);
  if (isToday(iso)) return `Today ${time}`;
  if (isTomorrow(iso)) return `Tomorrow ${time}`;
  return `${date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ${time}`;
};

/**
 * The moment a reminder actually fires. A snooze pushes the effective time
 * without touching the original reminder time.
 */
export const effectiveReminderTime = (
  remindAt: string | null | undefined,
  snoozedUntil: string | null | undefined
): string | null => {
  if (!remindAt) return null;
  if (!snoozedUntil) return remindAt;
  const snooze = new Date(snoozedUntil);
  if (Number.isNaN(snooze.getTime())) return remindAt;
  return snooze.getTime() > new Date(remindAt).getTime() ? snoozedUntil : remindAt;
};

/**
 * Next occurrence of a repeating reminder. Computed on local wall clock time
 * so a daily 9:00 AM reminder stays at 9:00 AM across DST changes.
 */
export const nextOccurrence = (iso: string, repeat: ReminderRepeat): string | null => {
  if (repeat === 'none') return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  switch (repeat) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly': {
      const day = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, lastDayOfMonth));
      break;
    }
    default:
      return null;
  }

  return date.toISOString();
};

/** Reminder presets offered next to the date picker. */
export const reminderPresets = (): { label: string; value: string }[] => {
  const now = new Date();

  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const tonight = new Date(now);
  tonight.setHours(20, 0, 0, 0);
  if (tonight.getTime() <= now.getTime()) tonight.setDate(tonight.getDate() + 1);

  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);

  return [
    { label: '+1 hour', value: inOneHour.toISOString() },
    { label: 'Tonight 8 PM', value: tonight.toISOString() },
    { label: 'Tomorrow 9 AM', value: tomorrowMorning.toISOString() },
  ];
};
