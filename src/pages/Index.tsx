import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Grid3x3, List, Plus } from "lucide-react";
import { StickyNote } from "@/components/StickyNote";
import type { NoteStatus as StickyNoteStatus } from "@/components/StickyNote";
import { AddNoteDialog } from "@/components/AddNoteDialog";
import { NoteDetailDialog } from "@/components/NoteDetailDialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Note } from "@/types/note";
import { 
  getNotes as fetchNotes, 
  createNote as createNoteService, 
  updateNote as updateNoteService, 
  deleteNote as deleteNoteService,
  updateNoteStatus as updateNoteStatusService,
  updateNotePinStatus as updateNotePinStatusService
} from "@/services/notesService";

// Using the Note interface from types/note.ts

const colors = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const statusColors: Record<StickyNoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200",
  "Backlog": "bg-gray-100 text-gray-800 border-gray-200",
};

const Index = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load notes on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const loadedNotes = await fetchNotes();
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Error loading notes:', error);
        toast.error('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const addNote = async (content: string, status: StickyNoteStatus, color: string) => {
    try {
      const newNote = await createNoteService({
        content,
        color,
        status,
        pinned: false,
        lastUpdated: Date.now()
      });
      
      setNotes(prevNotes => [newNote, ...prevNotes]);
      setDialogOpen(false);
      toast.success('Note added successfully!');
    } catch (error) {
      console.error('Error in addNote:', {
        error,
        content,
        status,
        color,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while adding the note';
      
      toast.error(`Failed to add note: ${errorMessage}`, {
        duration: 5000,
        style: {
          background: '#ffebee',
          color: '#c62828',
          border: '1px solid #ffcdd2',
          padding: '12px',
          borderRadius: '4px',
        },
      });
    }
  };

  const updateNote = async (id: string, content: string, status: StickyNoteStatus, color: string) => {
    try {
      const updatedNote = await updateNoteService(id, { 
        content, 
        status, 
        color
      });
      
      if (updatedNote) {
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === id ? { ...updatedNote } : note
          )
        );
        setDetailDialogOpen(false);
        toast.success('Note updated!');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleStatusChange = async (id: string, status: StickyNoteStatus) => {
    try {
      const updatedNote = await updateNoteStatusService(id, status);

      if (updatedNote) {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === id ? { ...updatedNote } : note
          )
        );
      }
    } catch (error) {
      console.error('Error updating note status:', error);
      toast.error('Failed to update note status');
    }
  };

  const togglePin = async (id: string) => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      const updatedNote = await updateNotePinStatusService(id, !note.pinned);

      if (updatedNote) {
        setNotes(prevNotes =>
          prevNotes.map(note =>
            note.id === id ? { ...updatedNote } : note
          )
        );
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteNoteService(id);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      setDetailDialogOpen(false);
      toast.success('Note deleted!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const openNoteDetail = (note: Note) => {
    setSelectedNote(note);
    setDetailDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

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
              <p className="text-muted-foreground mt-1">
                Made by{" "}
                <a 
                  href="https://github.com/slammers001" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-foreground transition-colors"
                >
                  slammers001
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="icon"
                onClick={() => setDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <div className="h-6 w-px bg-border mx-1"></div>
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
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <button 
              onClick={() => setDialogOpen(true)}
              className="group w-48 h-48 mb-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800/50 transition-all duration-300 hover:-rotate-12 focus:outline-none"
              aria-label="Add new note"
            >
              <img 
                src="/stickee.png" 
                alt="Stickee" 
                className="w-5/6 h-5/6 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </button>
            <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
              No sticky notes yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Click the Stickee icon to create your first sticky note!
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {[...notes].sort((a, b) => {
              // First sort by pinned status
              if (a.pinned !== b.pinned) {
                return b.pinned ? 1 : -1;
              }
              // Then sort by lastUpdated in descending order (newest first)
              return b.lastUpdated - a.lastUpdated;
            }).map((note, index) => (
              <StickyNote
                key={note.id}
                content={note.content}
                color={note.color}
                status={note.status}
                index={index}
                lastUpdated={note.lastUpdated}
                pinned={note.pinned}
                onClick={() => openNoteDetail(note)}
                onTogglePin={() => togglePin(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {[...notes].sort((a, b) => {
              // First sort by pinned status
              if (a.pinned !== b.pinned) {
                return b.pinned ? 1 : -1;
              }
              // Then sort by lastUpdated in descending order (newest first)
              return b.lastUpdated - a.lastUpdated;
            }).map((note) => {
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
      {selectedNote && (
        <NoteDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          note={selectedNote}
          onSave={updateNote}
          onDelete={deleteNote}
        />
      )}
    </div>
  );
};

export default Index;
