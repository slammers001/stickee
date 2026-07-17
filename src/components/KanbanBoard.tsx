import { useState } from "react";
import type { Note, NoteStatus } from "@/types/note";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { LinkableText } from "./LinkableText";

const COLUMNS: { id: NoteStatus; label: string }[] = [
  { id: "Backlog", label: "Backlog" },
  { id: "To-Do", label: "To-Do" },
  { id: "Doing", label: "Doing" },
  { id: "Done", label: "Done" },
];

const columnBorder: Record<NoteStatus, string> = {
  "To-Do": "border-red-400",
  "Doing": "border-blue-400",
  "Done": "border-green-400",
  "Backlog": "border-gray-400",
};

const headerBg: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 dark:bg-red-950/30",
  "Doing": "bg-blue-100 dark:bg-blue-950/30",
  "Done": "bg-green-100 dark:bg-green-950/30",
  "Backlog": "bg-gray-100 dark:bg-gray-800/30",
};

const noteColorMap: Record<string, string> = {
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

interface KanbanBoardProps {
  notes: Note[];
  onStatusChange: (noteId: string, newStatus: NoteStatus) => void;
  onNoteClick: (note: Note) => void;
}

export function KanbanBoard({ notes, onStatusChange, onNoteClick }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<NoteStatus | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);

  const getColumnNotes = (status: NoteStatus) =>
    notes.filter((n) => n.status === status);

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData("text/plain", noteId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent, status: NoteStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: NoteStatus) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData("text/plain");
    if (noteId) {
      onStatusChange(noteId, status);
    }
    setDragOverColumn(null);
    setDraggedNoteId(null);
  };

  const handleDragEnd = () => {
    setDragOverColumn(null);
    setDraggedNoteId(null);
  };

  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-6 h-full min-h-[calc(100vh-12rem)]">
        {COLUMNS.map((column) => {
          const columnNotes = getColumnNotes(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                "flex-1 min-w-[220px] max-w-[320px] flex flex-col",
                "border-[3px] rounded-none",
                columnBorder[column.id],
                "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] dark:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]",
                isOver && "shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] translate-x-[-2px] translate-y-[-2px]"
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className={cn("flex items-center gap-2 px-4 py-3 border-b-[3px]", columnBorder[column.id], headerBg[column.id])}>
                <h3 className="font-handwriting text-xl font-bold text-foreground">{column.label}</h3>
                <span className="ml-auto text-xs font-bold text-foreground border-2 border-foreground px-1.5 py-0.5">
                  {columnNotes.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-card">
                {columnNotes.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground font-handwriting border-2 border-dashed border-foreground/20 p-2">
                    Drop notes here
                  </div>
                ) : (
                  columnNotes.map((note) => (
                    <div
                      key={note.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onNoteClick(note)}
                      className={cn(
                        "group p-3 cursor-pointer transition-all",
                        "border-[3px] border-foreground/20 hover:border-foreground/60",
                        "shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]",
                        "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                        "rounded-none",
                        noteColorMap[note.color] || "bg-card",
                        draggedNoteId === note.id && "opacity-40 scale-95"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical
                          size={16}
                          className="mt-0.5 shrink-0 text-foreground/50"
                        />
                        <div className="min-w-0 flex-1">
                          {note.title && (
                            <p className="text-base font-bold text-foreground truncate mb-1 font-handwriting">
                              {note.title}
                            </p>
                          )}
                          <LinkableText
                            text={note.content.length > 80 ? note.content.slice(0, 80) + "..." : note.content}
                            className="text-sm text-foreground/70 leading-relaxed line-clamp-3 font-handwriting"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
