import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bell, Trash2, Mic, MicOff } from "lucide-react";
import { NoteStatus } from "./StickyNote";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { cn, limitInsertedText } from "@/lib/utils";
import { toast } from "sonner";
import { soundEffects } from "@/utils/soundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { ReminderEditor } from "@/components/ReminderEditor";
import { AttachmentPicker } from "@/components/AttachmentPicker";
import type { ReminderRepeat } from "@/types/note";
import type { NoteAttachment } from "@/types/attachment";

interface NoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: {
    id: string;
    title?: string;
    content: string;
    color: string;
    status: NoteStatus;
    lastUpdated: number;
    pinned: boolean;
  } | null;
  /** Files already attached to this note. */
  existingAttachments?: NoteAttachment[];
  onSave: (
    id: string,
    title: string,
    content: string,
    status: NoteStatus,
    color: string,
    files?: File[]
  ) => void;
  onDelete: (id: string) => void;
  onRemoveAttachment?: (attachment: NoteAttachment) => void | Promise<void>;
  onAddNote?: (title: string, content: string, status: NoteStatus, color: string) => void;
  /** The note's current reminder (if it has one) */
  reminder?: { remindAt: string | null; repeat: ReminderRepeat } | null;
  /** Persists a reminder change (null clears it) */
  onSaveReminder?: (remindAt: string | null, repeat: ReminderRepeat) => void | Promise<void>;
}

const colors = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const colorClasses: Record<string, string> = {
  yellow: "bg-[hsl(var(--note-yellow))]",
  pink: "bg-[hsl(var(--note-pink))]",
  blue: "bg-[hsl(var(--note-blue))]",
  green: "bg-[hsl(var(--note-green))]",
  purple: "bg-[hsl(var(--note-purple))]",
  orange: "bg-[hsl(var(--note-orange))]",
  teal: "bg-[hsl(var(--note-teal))]",
  lavender: "bg-[hsl(var(--note-lavender))]",
  peach: "bg-[hsl(var(--note-peach))]",
  mint: "bg-[hsl(var(--note-mint))]",
};

const statuses: NoteStatus[] = ["Backlog", "To-Do", "Doing", "Done"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  "Backlog": "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300",
};

const repeatLabels: Record<ReminderRepeat, string> = {
  none: "Once",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function formatReminder(value: string | null, repeat: ReminderRepeat) {
  if (!value) return "None";
  const date = new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return repeat === "none" ? date : `${repeatLabels[repeat]} · ${date}`;
}

export const NoteDetailDialog = ({
  open,
  onOpenChange,
  note,
  existingAttachments = [],
  onSave,
  onDelete,
  onAddNote,
  reminder,
  onSaveReminder,
  onRemoveAttachment,
}: NoteDetailDialogProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [status, setStatus] = useState<NoteStatus>(note?.status || "To-Do");
  const [color, setColor] = useState(note?.color || "yellow");
  const [initialStatus, setInitialStatus] = useState<NoteStatus>(note?.status || "To-Do");
  const [initialColor, setInitialColor] = useState(note?.color || "yellow");
  const [initialTitle, setInitialTitle] = useState(note?.title || "");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [remindAt, setRemindAt] = useState<string | null>(reminder?.remindAt ?? null);
  const [remindRepeat, setRemindRepeat] = useState<ReminderRepeat>(reminder?.repeat ?? "none");
  const [reminderOpen, setReminderOpen] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setCallbacks
  } = useVoiceRecognition();

  const hasUnsavedChanges = 
    title.trim() !== (initialTitle || "") ||
    content.trim() !== (note?.content || "") ||
    status !== initialStatus ||
    color !== initialColor ||
    attachments.length > 0;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(newOpen);
  };

  const handleSaveAndClose = () => {
    if (note && content.trim()) {
      soundEffects.playSaveSound();
      onSave(note.id, title.trim(), content, status, color, attachments);
      setShowUnsavedDialog(false);
      onOpenChange(false);
    }
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleCancelUnsaved = () => {
    setShowUnsavedDialog(false);
  };

  const handleVoiceResultRef = useRef<(transcript: string) => void>(() => {});

  const handleVoiceResult = (transcript: string) => {
    setContent(prev => prev + (prev ? '\n' : '') + transcript);
  };

  handleVoiceResultRef.current = handleVoiceResult;

  useEffect(() => {
    setCallbacks(
      (result) => {
        if (result.isFinal) {
          handleVoiceResultRef.current(result.transcript);
        }
      },
      () => {
        setIsListening(false);
      }
    );
  }, [setCallbacks]);

  useEffect(() => {
    if (!open && isListening) {
      stopListening();
      setIsListening(false);
      resetTranscript();
    }
  }, [open, isListening, stopListening, resetTranscript]);

  useEffect(() => {
    if (open) {
      resetTranscript();
    }
  }, [open, resetTranscript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      startListening();
      setIsListening(true);
      textareaRef.current?.focus();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const { text, removed } = limitInsertedText(content, textarea.value, textarea.selectionEnd, 1500);
    setContent(text);
    if (removed > 0) {
      const caret = textarea.selectionEnd - removed;
      requestAnimationFrame(() => textarea.setSelectionRange(caret, caret));
      toast.info("Notes can have a maximum of 1500 characters", { id: "note-content-limit" });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 20) {
      setTitle(value);
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content);
      setStatus(note.status);
      setColor(note.color);
      setInitialStatus(note.status);
      setInitialColor(note.color);
      setInitialTitle(note.title || "");
      setAttachments([]);
      setReminderOpen(false);
    }
  }, [note]);

  useEffect(() => {
    setRemindAt(reminder?.remindAt ?? null);
    setRemindRepeat(reminder?.repeat ?? "none");
  }, [reminder?.remindAt, reminder?.repeat]);

  const handleSaveReminder = async (nextRemindAt: string | null, nextRepeat: ReminderRepeat) => {
    if (!onSaveReminder) return;
    setSavingReminder(true);
    try {
      await onSaveReminder(nextRemindAt, nextRepeat);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleSave = () => {
    if (note && content.trim()) {
      soundEffects.playSaveSound();
      onSave(note.id, title.trim(), content, status, color, attachments);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (note) {
      soundEffects.playDeleteSound();
      onDelete(note.id);
      onOpenChange(false);
    }
  };

  if (!note) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 mx-4 sm:mx-0">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle className="text-base">Edit stickee note</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-2">
            <div>
              <Input
                aria-label="Note title (optional)"
                placeholder="Title (optional)"
                value={title}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                className="note-composer-field h-auto border-0 bg-transparent p-0 font-title text-lg text-foreground shadow-none focus-visible:ring-0 dark:text-white dark:placeholder:text-gray-400"
              />
              <Textarea
                ref={textareaRef}
                aria-label="Note content"
                placeholder="Write your note here..."
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleContentKeyDown}
                className="note-composer-field mt-2 min-h-[130px] w-full resize-none border-0 bg-transparent p-0 font-handwriting text-lg leading-relaxed text-foreground shadow-none focus-visible:ring-0 dark:text-white dark:placeholder:text-gray-400"
              />
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-foreground/10 pt-2">
                <small className="text-[11px] text-muted-foreground">
                  {content.length}/1500 · Title {title.length}/20
                </small>
                {isSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    aria-label={isListening ? "Stop recording" : "Dictate note"}
                    className={cn(
                      "note-composer-mic inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      isListening
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    )}
                  >
                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {isListening ? "Stop" : "Dictate"}
                  </button>
                )}
              </div>
              {isListening && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <i
                        key={i}
                        className="h-3 w-1 animate-pulse rounded-full bg-destructive"
                        style={{ animationDelay: `${i * 0.1}s`, animationDuration: "1s" }}
                      />
                    ))}
                  </span>
                  Listening...
                </div>
              )}
              {transcript && (
                <p className="mt-1 truncate text-xs text-muted-foreground">Heard: {transcript}</p>
              )}
              {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>

            <div className="mt-4 space-y-3 pb-2">
              <div className="flex items-center gap-3">
                <label className="w-12 shrink-0 text-xs font-medium text-muted-foreground">Color</label>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      title={`${c} note`}
                      aria-label={`Select ${c} color`}
                      className={cn(
                        "note-composer-swatch h-7 w-7 rounded-full border-2 transition-all",
                        colorClasses[c],
                        color === c ? "scale-110 border-foreground" : "border-border hover:scale-105"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-12 shrink-0 text-xs font-medium text-muted-foreground">Status</label>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={status === s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "note-composer-status rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        "font-handwriting status-text text-base leading-tight",
                        status === s ? `selected ${statusColors[s]}` : "hover:bg-muted"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {onSaveReminder && (
                <>
                  <button
                    type="button"
                    aria-expanded={reminderOpen}
                    aria-controls="note-reminder-editor"
                    aria-label={`Reminder: ${formatReminder(remindAt, remindRepeat)}`}
                    onClick={() => setReminderOpen((current) => !current)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                      remindAt && "border-primary bg-primary/5"
                    )}
                  >
                    <Bell className="h-4 w-4 shrink-0" />
                    Reminder
                    <small className="ml-auto truncate text-xs font-normal text-muted-foreground">
                      {formatReminder(remindAt, remindRepeat)}
                    </small>
                  </button>
                  {reminderOpen && (
                    <div id="note-reminder-editor" className="border-t pt-3">
                      <ReminderEditor
                        value={remindAt}
                        repeat={remindRepeat}
                        saving={savingReminder}
                        onChange={(value, repeat) => {
                          setRemindAt(value);
                          setRemindRepeat(repeat);
                        }}
                        onSave={handleSaveReminder}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="border-t pt-3">
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Attachments
                </label>
                <AttachmentPicker
                  pending={attachments}
                  existing={existingAttachments}
                  onChange={setAttachments}
                  onRemoveExisting={onRemoveAttachment}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:flex-row">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <small className="hidden text-xs text-muted-foreground sm:block">Ctrl+Enter to save</small>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!content.trim()}>
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onSave={handleSaveAndClose}
        onDiscard={handleDiscardAndClose}
        onCancel={handleCancelUnsaved}
      />
    </>
  );
};
