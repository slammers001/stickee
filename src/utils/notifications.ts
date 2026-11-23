import type { ReminderItem } from '@/services/reminderService';

const isTauriRuntime = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const isBrowserNotificationSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

/**
 * Ask the OS for permission to show desktop notifications. Must be called from
 * a user gesture (the browser requires it).
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (isTauriRuntime()) {
    try {
      const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
      if (await isPermissionGranted()) return 'granted';
      const permission = await requestPermission();
      return permission === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      console.error('Error requesting desktop notification permission:', error);
      return 'unsupported';
    }
  }

  if (!isBrowserNotificationSupported()) return 'unsupported';

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
export const showReminderNotification = async (reminder: ReminderItem): Promise<void> => {
  const title = 'Stickee reminder';
  const body = reminder.title || reminder.content.slice(0, 80) || 'You have a reminder';

  if (isTauriRuntime()) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } = await import(
        '@tauri-apps/plugin-notification'
      );

      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === 'granted';
      }

      if (granted) {
        await sendNotification({ title, body });
      }
    } catch (error) {
      console.error('Error showing desktop notification:', error);
    }
    return;
  }

  if (!isBrowserNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      tag: `stickee-reminder-${reminder.id}`,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error showing reminder notification:', error);
  }
};
