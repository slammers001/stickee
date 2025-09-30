import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3, List } from "lucide-react";
import { StickyNote, NoteStatus } from "@/components/StickyNote";
import { AddNoteDialog } from "@/components/AddNoteDialog";
import { NoteDetailDialog } from "@/components/NoteDetailDialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  color: string;
  status: NoteStatus;
}

const colors = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200",
};

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const addNote = (content: string, status: NoteStatus) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      color: colors[Math.floor(Math.random() * colors.length)],
      status,
    };
    setNotes([newNote, ...notes]);
    toast.success("Note added!");
  };

  const updateNote = (id: string, content: string, status: NoteStatus) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content, status } : note
    ));
    toast.success("Note updated!");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    toast.success("Note deleted!");
  };

  const openNoteDetail = (note: Note) => {
    setSelectedNote(note);
    setDetailDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight font-handwriting">
                Stickee
              </h1>
              <p className="text-muted-foreground mt-1">Your digital sticky note board</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setDialogOpen(true)}
                className="font-handwriting"
              >
                <Plus className="h-5 w-5" />
                Add Note
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="container mx-auto px-4 py-8">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Plus className="w-12 h-12 text-accent-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
              No sticky notes yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Click the + button below to create your first sticky note!
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {notes.map((note, index) => (
              <StickyNote
                key={note.id}
                content={note.content}
                color={note.color}
                status={note.status}
                index={index}
                onClick={() => openNoteDetail(note)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {notes.map((note) => {
              const colorMap: Record<string, string> = {
                yellow: "border-l-[hsl(var(--note-yellow))]",
                pink: "border-l-[hsl(var(--note-pink))]",
                blue: "border-l-[hsl(var(--note-blue))]",
                green: "border-l-[hsl(var(--note-green))]",
                purple: "border-l-[hsl(var(--note-purple))]",
                orange: "border-l-[hsl(var(--note-orange))]",
                teal: "border-l-[hsl(var(--note-teal))]",
                lavender: "border-l-[hsl(var(--note-lavender))]",
                peach: "border-l-[hsl(var(--note-peach))]",
                mint: "border-l-[hsl(var(--note-mint))]",
              };
              
              return (
                <div
                  key={note.id}
                  className={cn(
                    "p-4 bg-card border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer",
                    colorMap[note.color]
                  )}
                  onClick={() => openNoteDetail(note)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-foreground font-handwriting text-lg flex-1 line-clamp-2">
                      {note.content}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-handwriting shrink-0", statusColors[note.status])}
                    >
                      {note.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={addNote}
      />

      {/* Note Detail Dialog */}
      <NoteDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        note={selectedNote}
        onSave={updateNote}
        onDelete={deleteNote}
      />
    </div>
  );
};

export default Index;
