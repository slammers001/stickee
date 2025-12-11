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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>View & Edit Note</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
            <Input
              placeholder="Add a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-title text-lg dark:text-white dark:placeholder:text-gray-400"
            />
          </div>
          <div>
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
          <div>
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
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] resize-none font-handwriting text-lg dark:text-white dark:placeholder:text-gray-400"
              placeholder="Type your note here..."
            />
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
          <Button onClick={handleSave} disabled={!content.trim() && title === initialTitle && status === initialStatus && color === initialColor}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
