import { useState } from "react";
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
import { NoteStatus } from "@/components/StickyNote";
import { cn } from "@/lib/utils";

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string, status: NoteStatus) => void;
}

const statuses: NoteStatus[] = ["To-Do", "Doing", "Done"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
};

export const AddNoteDialog = ({ open, onOpenChange, onSave }: AddNoteDialogProps) => {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<NoteStatus>("To-Do");

  const handleSave = () => {
    if (content.trim()) {
      onSave(content, status);
      setContent("");
      setStatus("To-Do");
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Sticky Note</DialogTitle>
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
              placeholder="Type your note here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[150px] resize-none font-handwriting text-lg"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Ctrl+Enter to save quickly
            </p>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
