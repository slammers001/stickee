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
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { NoteStatus } from "./StickyNote";
import { cn } from "@/lib/utils";

interface NoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: {
    id: string;
    content: string;
    color: string;
    status: NoteStatus;
  } | null;
  onSave: (id: string, content: string, status: NoteStatus) => void;
  onDelete: (id: string) => void;
}

const statuses: NoteStatus[] = ["To-Do", "Doing", "Done"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
};

export const NoteDetailDialog = ({
  open,
  onOpenChange,
  note,
  onSave,
  onDelete,
}: NoteDetailDialogProps) => {
  const [content, setContent] = useState(note?.content || "");
  const [status, setStatus] = useState<NoteStatus>(note?.status || "To-Do");
  const [initialStatus, setInitialStatus] = useState<NoteStatus>(note?.status || "To-Do");

  // Update local state when note prop changes
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setStatus(note.status);
      setInitialStatus(note.status);
    }
  }, [note]);

  const handleSave = () => {
    if (note && content.trim()) {
      onSave(note.id, content, status);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (note) {
      onDelete(note.id);
      onOpenChange(false);
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>View & Edit Note</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex gap-2">
              {statuses.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all font-handwriting text-base px-3 py-1",
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
              className="min-h-[300px] resize-none font-handwriting text-lg"
              placeholder="Type your note here..."
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim() && status === initialStatus}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
