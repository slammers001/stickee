import type { ReminderItem } from '@/services/reminderService';

/**
 * Ask the OS for permission to show desktop notifications. Must be called from
 * a user gesture (the browser requires it).
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';

  try {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/** Show a desktop notification for a reminder, if we are allowed to. */
export const showReminderNotification = (reminder: ReminderItem): void => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification('Stickee reminder', {
      body: reminder.title || reminder.content.slice(0, 80),
      tag: `stickee-reminder-${reminder.noteId}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error showing reminder notification:', error);
  }
};
