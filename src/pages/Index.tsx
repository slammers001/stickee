import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StickyNote } from "@/components/StickyNote";
import { AddNoteDialog } from "@/components/AddNoteDialog";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  color: string;
}

const colors = ["yellow", "pink", "blue", "green", "purple"];

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setNotes([newNote, ...notes]);
    toast.success("Note added!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Stickee
          </h1>
          <p className="text-muted-foreground mt-1">Your digital sticky note board</p>
        </div>
      </header>

      {/* Main Board */}
      <main className="container mx-auto px-4 py-8">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Plus className="w-12 h-12 text-accent-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              No sticky notes yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Click the + button below to create your first sticky note!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map((note, index) => (
              <StickyNote
                key={note.id}
                content={note.content}
                color={note.color}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform"
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="h-8 w-8" />
      </Button>

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={addNote}
      />
    </div>
  );
};

export default Index;
