import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { NoteStatus } from "./StickyNote";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/utils/soundEffects";

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
  onSave: (id: string, title: string, content: string, status: NoteStatus, color: string) => void;
  onDelete: (id: string) => void;
}

const colors = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const statuses: NoteStatus[] = ["To-Do", "Doing", "Done"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  "Backlog": "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
};

export const NoteDetailDialog = ({
  open,
  onOpenChange,
  note,
  onSave,
  onDelete,
}: NoteDetailDialogProps) => {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [status, setStatus] = useState<NoteStatus>(note?.status || "To-Do");
  const [color, setColor] = useState(note?.color || "yellow");
  const [initialStatus, setInitialStatus] = useState<NoteStatus>(note?.status || "To-Do");
  const [initialColor, setInitialColor] = useState(note?.color || "yellow");
  const [initialTitle, setInitialTitle] = useState(note?.title || "");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const hasUnsavedChanges = 
    title.trim() !== (initialTitle || "") ||
    content.trim() !== (note?.content || "") ||
    status !== initialStatus ||
    color !== initialColor;

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
      onSave(note.id, title.trim(), content, status, color);
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit to 1500 characters
    if (value.length <= 1500) {
      setContent(value);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to 20 characters
    if (value.length <= 20) {
      setTitle(value);
    }
  };

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Ctrl+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  // Update local state when note prop changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content);
      setStatus(note.status);
      setColor(note.color);
      setInitialStatus(note.status);
      setInitialColor(note.color);
      setInitialTitle(note.title || "");
    }
  }, [note]);

  const handleSave = () => {
    if (note && content.trim()) {
      soundEffects.playSaveSound();
      onSave(note.id, title.trim(), content, status, color);
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>View & Edit Note</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="order-1">
            <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
            <Input
              placeholder="Add a title..."
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              className="font-title text-lg dark:text-white dark:placeholder:text-gray-400"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {title.length}/20 characters
            </div>
          </div>
          <div className="order-2 sm:order-3">
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => {
                const colorMap: Record<string, string> = {
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
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all border-2",
                      colorMap[c],
                      color === c ? "border-foreground scale-110" : "border-border hover:scale-105"
                    )}
                    aria-label={`Select ${c} color`}
                  />
                );
              })}
            </div>
          </div>
          <div className="order-3 sm:order-2">
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleContentKeyDown}
              className="min-h-[300px] resize-none font-handwriting text-lg dark:text-white dark:placeholder:text-gray-400"
              placeholder="Type your note here..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Ctrl+Enter to save quickly • Maximum 1500 characters
            </p>
            <div className="text-xs text-muted-foreground mt-1">
              {content.length}/1500 characters
            </div>
          </div>
          <div className="order-4">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex gap-2">
              {statuses.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all font-handwriting text-base px-3 py-1 status-text",
                    status === s ? "selected" : "",
                    status === s ? statusColors[s] : "hover:bg-muted"
                  )}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim() && title === initialTitle && status === initialStatus && color === initialColor}>
            Save Changes
          </Button>
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
