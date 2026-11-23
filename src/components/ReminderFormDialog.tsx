import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReminderEditor } from "@/components/ReminderEditor";
import type { ReminderItem } from "@/services/reminderService";
import type { ReminderRepeat } from "@/types/note";

export interface ReminderFormValues {
  title: string;
  remindAt: string;
  repeat: ReminderRepeat;
}

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing reminder to edit, or null when creating a new standalone one. */
  reminder?: ReminderItem | null;
  onSave: (values: ReminderFormValues) => Promise<void>;
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder = null,
  onSave,
}: ReminderFormDialogProps) {
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState<string | null>(null);
  const [repeat, setRepeat] = useState<ReminderRepeat>("none");
  const [saving, setSaving] = useState(false);

  const isNoteReminder = reminder?.source === "note";

  useEffect(() => {
    if (!open) return;
    setTitle(reminder?.title ?? "");
    setRemindAt(reminder?.remindAt ?? null);
    setRepeat(reminder?.repeat ?? "none");
  }, [open, reminder?.id, reminder?.title, reminder?.remindAt, reminder?.repeat]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!remindAt) return;
    if (!isNoteReminder && !title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: isNoteReminder ? (reminder?.title ?? "") : title.trim(),
        remindAt,
        repeat,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving reminder:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{reminder ? "Edit reminder" : "New reminder"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isNoteReminder ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">Note</label>
              <p className="text-sm text-muted-foreground truncate">
                {reminder?.title || reminder?.content.slice(0, 80) || "Untitled note"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reminder-title">
                Reminder
              </label>
              <Input
                id="reminder-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What do you need to remember?"
                maxLength={80}
                autoFocus
              />
            </div>
          )}

          <ReminderEditor
            value={remindAt}
            repeat={repeat}
            onChange={(value, nextRepeat) => {
              setRemindAt(value);
              setRepeat(nextRepeat);
            }}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!remindAt || saving || (!isNoteReminder && !title.trim())}
            >
              {saving ? "Saving..." : reminder ? "Save changes" : "Add reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
