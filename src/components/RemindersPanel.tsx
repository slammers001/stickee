import { useMemo, useState } from "react";
import { Bell, BellRing, Check, Clock, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReminderFormDialog, type ReminderFormValues } from "@/components/ReminderFormDialog";
import { cn } from "@/lib/utils";
import { formatReminderDate, isOverdue, isToday } from "@/utils/reminderTime";
import type { ReminderItem } from "@/services/reminderService";

const SNOOZE_OPTIONS = [
  { label: "10 minutes", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "Tomorrow", minutes: 60 * 24 },
];

interface RemindersPanelProps {
  reminders: ReminderItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenNote?: (noteId: string) => void;
  onSnooze: (reminder: ReminderItem, minutes: number) => Promise<void>;
  onComplete: (reminder: ReminderItem) => Promise<void>;
  onDismiss: (reminder: ReminderItem) => Promise<void>;
  onRemove: (reminder: ReminderItem) => Promise<void>;
  onCreate: (values: ReminderFormValues) => Promise<void>;
  onUpdate: (reminder: ReminderItem, values: ReminderFormValues) => Promise<void>;
}

export function RemindersPanel({
  reminders,
  loading,
  onRefresh,
  onOpenNote,
  onSnooze,
  onComplete,
  onDismiss,
  onRemove,
  onCreate,
  onUpdate,
}: RemindersPanelProps) {
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  const groups = useMemo(() => {
    const pending = reminders.filter((reminder) => reminder.state === "pending");
    const finished = reminders.filter((reminder) => reminder.state !== "pending");

    return {
      overdue: pending.filter((reminder) => isOverdue(reminder.effectiveAt)),
      today: pending.filter((reminder) => !isOverdue(reminder.effectiveAt) && isToday(reminder.effectiveAt)),
      upcoming: pending.filter((reminder) => !isOverdue(reminder.effectiveAt) && !isToday(reminder.effectiveAt)),
      finished,
    };
  }, [reminders]);

  const runAction = async (noteId: string, action: () => Promise<void>) => {
    setBusyNoteId(noteId);
    try {
      await action();
      onRefresh();
    } catch (error) {
      console.error("Error updating reminder:", error);
    } finally {
      setBusyNoteId(null);
    }
  };

  const renderRow = (reminder: ReminderItem) => {
    const overdue = reminder.state === "pending" && isOverdue(reminder.effectiveAt);
    const dueToday = reminder.state === "pending" && isToday(reminder.effectiveAt);
    const isBusy = busyNoteId === reminder.id;

    return (
      <div
        key={reminder.id}
        className={cn(
          "flex items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors",
          overdue ? "border-red-300 dark:border-red-900" : "border-border"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {overdue ? (
              <BellRing strokeWidth={2} className="h-4 w-4 text-red-500 shrink-0" />
            ) : dueToday ? (
              <BellRing strokeWidth={2} className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <Bell strokeWidth={2} className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-title text-lg text-foreground truncate">
              {reminder.title || reminder.content.slice(0, 40) || "Untitled note"}
            </span>
          </div>
          {reminder.title && (
            <p className="text-sm text-muted-foreground font-handwriting truncate mt-1">
              {reminder.content.slice(0, 80)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <Clock strokeWidth={2} className="h-3 w-3 text-muted-foreground" />
            <span className={cn("text-muted-foreground", overdue && "text-red-500 font-semibold")}>
              {overdue ? "Overdue - " : ""}
              {formatReminderDate(reminder.effectiveAt)}
            </span>
            {reminder.repeat !== "none" && (
              <span className="text-muted-foreground capitalize">- {reminder.repeat}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenNote && reminder.noteId && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Open note"
              aria-label="Open note"
              onClick={() => onOpenNote(reminder.noteId as string)}
            >
              <ExternalLink strokeWidth={2} className="h-4 w-4" />
            </Button>
          )}

          {reminder.state === "pending" && (
            <>
              <Popover open={snoozeOpen === reminder.id} onOpenChange={(open) => setSnoozeOpen(open ? reminder.id : null)}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="Snooze"
                    aria-label="Snooze reminder"
                    disabled={isBusy}
                  >
                    <Clock strokeWidth={2} className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-40 p-2">
                  {SNOOZE_OPTIONS.map((option) => (
                    <button
                      key={option.minutes}
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                      onClick={async () => {
                        setSnoozeOpen(null);
                        await runAction(reminder.id, () => onSnooze(reminder, option.minutes));
                      }}
                    >
                      Snooze {option.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Complete"
                aria-label="Complete reminder"
                disabled={isBusy}
                onClick={() => runAction(reminder.id, () => onComplete(reminder))}
              >
                <Check strokeWidth={2} className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Dismiss"
                aria-label="Dismiss reminder"
                disabled={isBusy}
                onClick={() => runAction(reminder.id, () => onDismiss(reminder))}
              >
                <X strokeWidth={2} className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Edit reminder"
            aria-label="Edit reminder"
            disabled={isBusy}
            onClick={() => {
              setEditingReminder(reminder);
              setFormOpen(true);
            }}
          >
            <Pencil strokeWidth={2} className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Remove reminder"
            aria-label="Remove reminder"
            disabled={isBusy}
            onClick={() => runAction(reminder.id, () => onRemove(reminder))}
          >
            <Trash2 strokeWidth={2} className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: ReminderItem[]) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title} ({items.length})
        </h2>
        <div className="space-y-3">{items.map(renderRow)}</div>
      </section>
    );
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
          Loading reminders...
        </div>
      </main>
    );
  }

  const openCreateForm = () => {
    setEditingReminder(null);
    setFormOpen(true);
  };

  const hasReminders =
    groups.overdue.length + groups.today.length + groups.upcoming.length + groups.finished.length > 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-handwriting">Reminders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Things you asked to be nudged about.
            </p>
          </div>
          <Button onClick={openCreateForm}>
            <Plus strokeWidth={2} className="h-4 w-4 mr-2" />
            New reminder
          </Button>
        </div>

        {!hasReminders ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <Bell strokeWidth={1.5} className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
              No reminders yet
            </h2>
            <p className="text-muted-foreground max-w-md mb-4">
              Add a reminder here, or open a note and set one on it.
            </p>
            <Button onClick={openCreateForm}>
              <Plus strokeWidth={2} className="h-4 w-4 mr-2" />
              New reminder
            </Button>
          </div>
        ) : (
          <>
            {renderSection("Overdue", groups.overdue)}
            {renderSection("Today", groups.today)}
            {renderSection("Upcoming", groups.upcoming)}
            {renderSection("Completed", groups.finished)}
          </>
        )}
      </div>

      <ReminderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        reminder={editingReminder}
        onSave={(values) =>
          editingReminder ? onUpdate(editingReminder, values) : onCreate(values)
        }
      />
    </main>
  );
}
