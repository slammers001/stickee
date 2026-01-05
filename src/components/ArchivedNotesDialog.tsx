import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getArchivedNotes, unarchiveNote, deleteArchivedNote } from "@/services/archiveService";
import { getReactionsForNote } from "@/services/emojiReactionService";
import { StickyNote } from "@/components/StickyNote";
import { NoteDetailDialog } from "@/components/NoteDetailDialog";
import { updateNote } from "@/services/notesService";
import { soundEffects } from "@/utils/soundEffects";
import type { Note } from "@/types/note";
import type { ReactionSummary } from "@/types/emojiReaction";

interface ArchivedNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotesRefresh?: () => Promise<void>;
}

export function ArchivedNotesDialog({ open, onOpenChange, onNotesRefresh }: ArchivedNotesDialogProps) {
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteReactions, setNoteReactions] = useState<Record<string, ReactionSummary[]>>({});
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const loadArchivedNotes = async () => {
    try {
      setLoading(true);
      const notes = await getArchivedNotes();
      setArchivedNotes(notes);
      
      // Load reactions for archived notes
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
    if (open) {
      loadArchivedNotes();
    }
  }, [open]);

  const handleUnarchive = async (noteId: string) => {
    // Play restore sound immediately (don't await)
    soundEffects.playRestoreSound();
    
    // Remove from UI immediately for instant feedback
    setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
    
    try {
      // Perform the actual unarchive operation in background
      await unarchiveNote(noteId);
      toast.success('Note unarchived successfully!');
      
      // Refresh the main notes list after a short delay to show the restored note
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
      // Re-add the note to the list if there was an error
      await loadArchivedNotes();
    }
  };

  const handleDelete = async (noteId: string) => {
    console.log('Delete button clicked for note:', noteId);
    
    // Play delete sound immediately (don't await)
    soundEffects.playDeleteSound();
    
    // Remove from UI immediately for instant feedback
    setArchivedNotes(prev => prev.filter(note => note.id !== noteId));
    
    try {
      // Perform the actual delete operation in background
      await deleteArchivedNote(noteId);
      toast.success('Archived note deleted permanently!');
    } catch (error) {
      console.error('Error deleting archived note:', error);
      toast.error('Failed to delete archived note');
      // Re-add the note to the list if there was an error
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
      // Play delete sound immediately (don't await)
      soundEffects.playDeleteSound();
      
      // Remove from UI immediately for instant feedback
      setArchivedNotes(prev => prev.filter(note => note.id !== id));
      
      // Perform the actual delete operation in background
      await deleteArchivedNote(id);
      
      toast.success('Archived note deleted permanently!');
      setEditDialogOpen(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error deleting archived note:', error);
      toast.error('Failed to delete archived note');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] flex flex-col mx-2 sm:mx-4 p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Notes
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading archived notes...</div>
            </div>
          ) : archivedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Archive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No archived notes</h3>
              <p className="text-muted-foreground">
                Notes you archive will appear here. You can unarchive them or delete them permanently.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 px-2">
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
                    onTogglePin={() => {}} // No pin action for archived notes
                  />
                  
                  {/* Action buttons overlay */}
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
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {archivedNotes.length} archived note{archivedNotes.length !== 1 ? 's' : ''}
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
      
      {/* Note Detail Dialog for editing archived notes */}
      {selectedNote && (
        <NoteDetailDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          note={selectedNote}
          onSave={handleUpdateNote}
          onDelete={handleDeleteFromEdit}
        />
      )}
    </Dialog>
  );
}
