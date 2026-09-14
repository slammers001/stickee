import { useState, useEffect } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getArchivedNotes, unarchiveNote, deleteArchivedNote } from "@/services/archiveService";
import { getReactionsForNote } from "@/services/emojiReactionService";
import { StickyNote } from "@/components/StickyNote";
import { NoteDetailDialog } from "@/components/NoteDetailDialog";
import { updateNote } from "@/services/notesService";
import { soundEffects } from "@/utils/soundEffects";
import type { Note } from "@/types/note";
import type { ReactionSummary } from "@/types/emojiReaction";

interface ArchivedNotesPanelProps {
  onNotesRefresh?: () => Promise<void>;
}

export function ArchivedNotesPanel({ onNotesRefresh }: ArchivedNotesPanelProps) {
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteReactions, setNoteReactions] = useState<Record<string, ReactionSummary[]>>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadArchivedNotes = async () => {
    try {
      setLoading(true);
      const notes = await getArchivedNotes();
      setArchivedNotes(notes);
      
      const reactionPromises = notes.map(async (note) => {
        try {
          const reactions = await getReactionsForNote(note.id);
          return { noteId: note.id, reactions };
        } catch (error) {
          console.error('Error loading reactions for archived note:', error);
          return { noteId: note.id, reactions: [] };
        }
      });

      const reactionResults = await Promise.all(reactionPromises);
      
      const reactionsMap: Record<string, ReactionSummary[]> = {};
      reactionResults.forEach(({ noteId, reactions }) => {
        reactionsMap[noteId] = reactions;
      });
      
      setNoteReactions(reactionsMap);
    } catch (error) {
      console.error('Error loading archived notes:', error);
      toast.error('Failed to load archived notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedNotes();
  }, []);

  const handleUnarchive = async (noteId: string) => {
    soundEffects.playRestoreSound();
    setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
    
    try {
      await unarchiveNote(noteId);
      toast.success('Note unarchived successfully!');
      
      if (onNotesRefresh) {
        setTimeout(async () => {
          try {
            await onNotesRefresh();
          } catch (error) {
            console.error('Error refreshing notes:', error);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error unarchiving note:', error);
      toast.error('Failed to unarchive note');
      await loadArchivedNotes();
    }
  };

  const handleDelete = async (noteId: string) => {
    soundEffects.playDeleteSound();
    setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
    
    try {
      await deleteArchivedNote(noteId);
      toast.success('Archived note deleted permanently!');
    } catch (error) {
      console.error('Error deleting archived note:', error);
      toast.error('Failed to delete archived note');
      await loadArchivedNotes();
    }
  };

  const handleReactionUpdate = (noteId: string, reactions: ReactionSummary[]) => {
    setNoteReactions(prev => ({
      ...prev,
      [noteId]: reactions
    }));
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditDialogOpen(true);
  };

  const handleUpdateNote = async (id: string, title: string, content: string, status: any, color: string) => {
    try {
      const updatedNote = await updateNote(id, { 
        title: title || undefined,
        content, 
        status, 
        color
      });
      
      if (updatedNote) {
        setArchivedNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === id ? { ...updatedNote } : note
          )
        );
        setEditDialogOpen(false);
        toast.success('Archived note updated!');
      }
    } catch (error) {
      console.error('Error updating archived note:', error);
      toast.error('Failed to update archived note');
    }
  };

  const handleDeleteFromEdit = async (id: string) => {
    try {
      soundEffects.playDeleteSound();
      setArchivedNotes(prev => prev.filter(note => note.id !== id));
      await deleteArchivedNote(id);
      toast.success('Archived note deleted permanently!');
      setEditDialogOpen(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error deleting archived note:', error);
      toast.error('Failed to delete archived note');
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading archived notes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {archivedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <Archive className="h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
            No archived notes
          </h2>
          <p className="text-muted-foreground max-w-md">
            Notes you archive will appear here. You can unarchive them or delete them permanently.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground font-handwriting">
              Archived Notes ({archivedNotes.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {archivedNotes.map((note) => (
              <div key={note.id} className="relative group">
                <StickyNote
                  id={note.id}
                  title={note.title}
                  content={note.content}
                  color={note.color}
                  status={note.status}
                  pinned={note.pinned}
                  reactions={noteReactions[note.id] || []}
                  onReactionUpdate={(reactions) => handleReactionUpdate(note.id, reactions)}
                  onClick={() => handleEditNote(note)}
                  onTogglePin={() => {}}
                />
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnarchive(note.id);
                    }}
                    className="bg-background/90 hover:bg-background"
                    title="Unarchive note"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(note.id);
                    }}
                    className="bg-background/90 hover:bg-background"
                    title="Delete permanently"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedNote && (
        <NoteDetailDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          note={selectedNote}
          onSave={handleUpdateNote}
          onDelete={handleDeleteFromEdit}
        />
      )}
    </main>
  );
}
