import { useState, useEffect } from "react";
import { Trash, RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getTrashedNotes, restoreFromTrash, permanentDeleteNote, emptyTrash } from "@/services/trashService";
import { getReactionsForNote } from "@/services/emojiReactionService";
import { StickyNote } from "@/components/StickyNote";
import { NoteDetailDialog } from "@/components/NoteDetailDialog";
import { updateNote } from "@/services/notesService";
import { soundEffects } from "@/utils/soundEffects";
import type { Note } from "@/types/note";
import type { ReactionSummary } from "@/types/emojiReaction";

interface TrashedNotesPanelProps {
  onNotesRefresh?: () => Promise<void>;
}

export function TrashedNotesPanel({ onNotesRefresh }: TrashedNotesPanelProps) {
  const [trashedNotes, setTrashedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteReactions, setNoteReactions] = useState<Record<string, ReactionSummary[]>>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);

  const loadTrashedNotes = async () => {
    try {
      setLoading(true);
      const notes = await getTrashedNotes();
      setTrashedNotes(notes);
      
      const reactionPromises = notes.map(async (note) => {
        try {
          const reactions = await getReactionsForNote(note.id);
          return { noteId: note.id, reactions };
        } catch (error) {
          console.error('Error loading reactions for trashed note:', error);
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
      console.error('Error loading trashed notes:', error);
      toast.error('Failed to load trashed notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashedNotes();
  }, []);

  const handleRestore = async (noteId: string) => {
    soundEffects.playRestoreSound();
    setTrashedNotes(prev => prev.filter(note => note.id !== noteId));
    
    try {
      await restoreFromTrash(noteId);
      toast.success('Note restored successfully!');
      
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
      console.error('Error restoring note:', error);
      toast.error('Failed to restore note');
      await loadTrashedNotes();
    }
  };

  const handlePermanentDelete = async (noteId: string) => {
    soundEffects.playDeleteSound();
    setTrashedNotes(prev => prev.filter(note => note.id !== noteId));
    
    try {
      await permanentDeleteNote(noteId);
      toast.success('Note deleted permanently!');
    } catch (error) {
      console.error('Error permanently deleting note:', error);
      toast.error('Failed to delete note');
      await loadTrashedNotes();
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash();
      setTrashedNotes([]);
      setShowEmptyTrashConfirm(false);
      toast.success('Trash emptied successfully!');
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Failed to empty trash');
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
        setTrashedNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === id ? { ...updatedNote } : note
          )
        );
        setEditDialogOpen(false);
        toast.success('Trashed note updated!');
      }
    } catch (error) {
      console.error('Error updating trashed note:', error);
      toast.error('Failed to update trashed note');
    }
  };

  const handleDeleteFromEdit = async (id: string) => {
    try {
      soundEffects.playDeleteSound();
      setTrashedNotes(prev => prev.filter(note => note.id !== id));
      await permanentDeleteNote(id);
      toast.success('Note deleted permanently!');
      setEditDialogOpen(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error permanently deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading trashed notes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {trashedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <Trash className="h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
            Trash is empty
          </h2>
          <p className="text-muted-foreground max-w-md">
            Deleted notes will appear here. You can restore them or delete them permanently.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground font-handwriting">
              Trash ({trashedNotes.length})
            </h2>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmptyTrashConfirm(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Empty Trash
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {trashedNotes.map((note) => (
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
                      handleRestore(note.id);
                    }}
                    className="bg-background/90 hover:bg-background"
                    title="Restore note"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePermanentDelete(note.id);
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

      {/* Empty Trash Confirmation Dialog */}
      {showEmptyTrashConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-md mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h3 className="text-lg font-semibold">Empty Trash?</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              This will permanently delete all {trashedNotes.length} note{trashedNotes.length !== 1 ? 's' : ''} in the trash. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEmptyTrashConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleEmptyTrash}
                className="bg-red-500 hover:bg-red-600"
              >
                Empty Trash
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
