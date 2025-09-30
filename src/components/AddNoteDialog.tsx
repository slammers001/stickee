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

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string) => void;
}

export const AddNoteDialog = ({ open, onOpenChange, onSave }: AddNoteDialogProps) => {
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
      setContent("");
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
        <div className="py-4">
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
