import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { completeReminder, getDueReminders, markFired, type ReminderItem } from '@/services/reminderService';
import { soundEffects } from '@/utils/soundEffects';
import { showReminderNotification } from '@/utils/notifications';
import { analytics, AnalyticsEvents } from '@/utils/analytics';

const CHECK_INTERVAL_MS = 30_000;

// Reminders that came due more than a day ago are only listed as overdue,
// they do not fire a toast when the app was closed for a long time.
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

interface UseReminderSchedulerOptions {
  onFired?: (reminder: ReminderItem) => void;
}

/**
 * Watches for reminders that come due and fires them (sound + toast + desktop
 * notification). Runs while the app is open.
 */
export const useReminderScheduler = ({ onFired }: UseReminderSchedulerOptions = {}) => {
  const onFiredRef = useRef(onFired);

  useEffect(() => {
    onFiredRef.current = onFired;
  }, [onFired]);

  useEffect(() => {
    let cancelled = false;

    const fireReminder = async (reminder: ReminderItem) => {
      try {
        await markFired(reminder.noteId);
      } catch (error) {
        console.error('Error marking reminder as fired:', error);
      }

      const overdueBy = Date.now() - new Date(reminder.effectiveAt).getTime();
      const isStale = overdueBy > STALE_AFTER_MS;

      if (!isStale) {
        soundEffects.playReminderSound();
        showReminderNotification(reminder);

        toast('⏰ Reminder', {
          description: reminder.title || reminder.content.slice(0, 80),
          duration: 15000,
          action: {
            label: 'Complete',
            onClick: async () => {
              try {
                await completeReminder(reminder);
                toast.success('Reminder completed');
              } catch (error) {
                console.error('Error completing reminder:', error);
                toast.error('Failed to complete reminder');
              }
            },
          },
        });
      }

      analytics.track(AnalyticsEvents.REMINDER_FIRED, {
        note_id: reminder.noteId,
        repeat: reminder.repeat,
        was_stale: isStale,
      });

      onFiredRef.current?.(reminder);
    };

    const check = async () => {
      if (cancelled) return;

      try {
        const due = await getDueReminders(new Date());
        for (const reminder of due) {
          if (cancelled) return;
          await fireReminder(reminder);
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);
};
