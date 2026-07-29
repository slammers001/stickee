import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LinkableText } from "@/components/LinkableText";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

const statusColors: Record<string, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200",
  Doing: "bg-blue-100 text-blue-800 border-blue-200",
  Done: "bg-green-100 text-green-800 border-green-200",
  Backlog: "bg-gray-200 text-gray-800 border-gray-300",
};

export function NotePreviewDialog({ note, open, onOpenChange }: { note: Note | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!note) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] w-[calc(100vw-1rem)] max-w-2xl overflow-x-hidden overflow-y-hidden" style={{ backgroundColor: `hsl(var(--note-${note.color}))` }}>
        <DialogHeader>
          <DialogTitle className="w-full max-w-[65ch] pr-8 text-2xl font-title break-words [overflow-wrap:break-word]">{note.title || "Untitled note"}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden">
          <div className="preview-scroll max-h-[min(52vh,30rem)] w-full max-w-[65ch] overflow-x-hidden overflow-y-auto overscroll-contain pr-2">
            <LinkableText text={note.content} className="w-full max-w-[65ch] whitespace-pre-wrap break-words [overflow-wrap:break-word] text-lg leading-relaxed font-handwriting" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-black/10 pt-4">
            <Badge variant="outline" className={cn("font-handwriting", statusColors[note.status])}>{note.status}</Badge>
            {note.tags?.map((tag) => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
            {note.dueDate && <span className="text-xs text-muted-foreground">Due {note.dueDate}</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
