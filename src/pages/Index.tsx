import { useState, useEffect, lazy, Suspense } from "react";
import { CheckSquare, Trash2, Pin, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  getNotes as fetchNotes, 
  createNote as createNoteService, 
  updateNote as updateNoteService, 
  deleteNote as deleteNoteService,
  updateNotePinStatus as updateNotePinStatusService,
  reorderNotes as reorderNotesService
} from "@/services/notesService";
import { ensureUserExists, updateUserVersion } from "@/services/userService";
import { getReactionsForNote } from "@/services/emojiReactionService";
import type { ReactionSummary } from "@/types/emojiReaction";
import { TermsPopup } from "@/components/TermsPopup";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { SearchBar } from "@/components/SearchBar";
import { StickyNote } from "@/components/StickyNote";
import { AddNoteDialog } from "@/components/AddNoteDialog";
import { MassDeleteDialog } from "@/components/MassDeleteDialog";
import { useChecklist } from "@/hooks/useChecklist";
import { cn } from "@/lib/utils";
import { useViewMode } from "@/contexts/ViewModeContext";
import type { Note } from "@/types/note";
import type { StickyNoteStatus } from "@/types/note";
import { analytics, AnalyticsEvents } from "@/utils/analytics";

// Lazy load non-critical components
const NoteDetailDialog = lazy(() => import("@/components/NoteDetailDialog").then(module => ({ default: module.NoteDetailDialog })));
const SettingsDialog = lazy(() => import("@/components/SettingsDialog").then(module => ({ default: module.SettingsDialog })));
const Checklist = lazy(() => import("@/components/Checklist").then(module => ({ default: module.Checklist })));
const StickyNoteWindow = lazy(() => import("@/components/StickyNoteWindow").then(module => ({ default: module.StickyNoteWindow })));

// Using the Note interface from types/note.ts

const statusColors: Record<StickyNoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200",
  "Backlog": "bg-gray-100 text-gray-800 border-gray-200",
};

export default function Index() {
  const { viewMode, setViewMode } = useViewMode();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stickyNoteWindowOpen, setStickyNoteWindowOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(() => {
    return localStorage.getItem("stickee-terms-agreed") === "true";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [noteReactions, setNoteReactions] = useState<Record<string, ReactionSummary[]>>({});
  const [showMassDeleteDialog, setShowMassDeleteDialog] = useState(false);
  
  // Checklist state and handlers
  const {
    items: checklistItems,
    isOpen: isChecklistOpen,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    updateItem: updateChecklistItem,
    deleteItem: deleteChecklistItem,
    toggleChecklist,
  } = useChecklist();

  // Check for terms agreement on mount and storage changes
  useEffect(() => {
    const checkTermsAgreement = () => {
      const agreed = localStorage.getItem("stickee-terms-agreed") === "true";
      setTermsAgreed(agreed);
    };

    checkTermsAgreement();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkTermsAgreement();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Apply saved font preference on component mount
  useEffect(() => {
    const savedFont = localStorage.getItem("stickee-font-family") as "handwriting" | "serif";
    if (savedFont) {
      const root = document.documentElement;
      if (savedFont === "serif") {
        root.style.setProperty('--font-family-base', 'Georgia, serif');
        root.style.setProperty('--font-family-handwriting', 'Georgia, serif');
      } else {
        root.style.setProperty('--font-family-base', 'Indie Flower, cursive');
        root.style.setProperty('--font-family-handwriting', 'Indie Flower, cursive');
      }
    }
  }, []);

  // Handle terms agreement
  const handleTermsAgree = () => {
    setTermsAgreed(true);
    localStorage.setItem("stickee-terms-agreed", "true");
    
    // Track terms agreement event
    analytics.track(AnalyticsEvents.TERMS_AGREED, {
      source: 'terms_popup'
    });
  };

  // Handle showing terms dialog
  const handleShowTermsDialog = (show: boolean) => {
    setShowTermsDialog(show);
  };

  // Keyboard shortcut for new note - optimized for INP
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if terms are agreed
      if (!termsAgreed) return;
      
      // Debounce rapid key presses to improve INP
      if (timeoutId) return;
      
      // Only trigger 'n' key if no input fields are focused and no dialogs are open
      if (
        e.key === 'n' && 
        !e.ctrlKey && 
        !e.metaKey && 
        !e.altKey &&
        !dialogOpen &&
        !detailDialogOpen &&
        !stickyNoteWindowOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setDialogOpen(true);
        timeoutId = setTimeout(() => { timeoutId = undefined as any; }, 100);
        return;
      }
      
      // Sticky note window shortcut - Alt+P keys
      if (
        e.key.toLowerCase() === 'p' && 
        e.altKey &&
        !e.ctrlKey && 
        !e.metaKey &&
        !dialogOpen &&
        !detailDialogOpen &&
        !stickyNoteWindowOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setStickyNoteWindowOpen(true);
        timeoutId = setTimeout(() => { timeoutId = undefined as any; }, 100);
      }
    };

    // Use passive listener for better performance
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dialogOpen, detailDialogOpen, stickyNoteWindowOpen, termsAgreed]);

  // Load reactions for all notes
  const loadReactions = async (notesToLoad: Note[]) => {
    if (notesToLoad.length === 0) return;
    
    try {
      const reactionPromises = notesToLoad.map(async (note) => {
        try {
          const reactions = await getReactionsForNote(note.id);
          return { noteId: note.id, reactions };
        } catch (error) {
          console.error('Error loading reactions for note:', error);
          return { noteId: note.id, reactions: [] };
        }
      });

      const reactionResults = await Promise.all(reactionPromises);
      
      const reactionsMap: Record<string, ReactionSummary[]> = {};
      reactionResults.forEach(({ noteId, reactions }) => {
        reactionsMap[noteId] = reactions;
      });
      
      setNoteReactions(prev => ({
        ...prev,
        ...reactionsMap
      }));
    } catch (error) {
      console.error('Error in loadReactions:', error);
    }
  };

  const handleReactionUpdate = (noteId: string, reactions: ReactionSummary[]) => {
    setNoteReactions(prev => ({
      ...prev,
      [noteId]: reactions
    }));
  };

  // Load notes on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        // Ensure user exists and update version
        await ensureUserExists();
        await updateUserVersion();
        
        const loadedNotes = await fetchNotes();
        setNotes(loadedNotes);
        setFilteredNotes(loadedNotes);
        
        // Load reactions after notes are loaded
        await loadReactions(loadedNotes);
      } catch (error) {
        console.error('Error loading notes:', error);
        toast.error('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Filter notes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(note => 
      note.content.toLowerCase().includes(query) ||
      note.status.toLowerCase().includes(query) ||
      note.color.toLowerCase().includes(query) ||
      (note.title && note.title.toLowerCase().includes(query))
    );
    setFilteredNotes(filtered);
  }, [searchQuery, notes]);

  const addNote = async (title: string, content: string, status: StickyNoteStatus, color: string) => {
    try {
      const newNote = await createNoteService({
        title: title || undefined,
        content,
        color,
        status,
        pinned: false,
        lastUpdated: Date.now()
      });
      
      setNotes(prevNotes => [newNote, ...prevNotes]);
      setFilteredNotes(prevNotes => [newNote, ...prevNotes]);
      
      // Load reactions for the new note immediately
      await loadReactions([newNote]);
      
      setDialogOpen(false);
      toast.success('Note added successfully!');
      
      // Track note creation event
      analytics.track(AnalyticsEvents.NOTE_CREATED, {
        note_id: newNote.id,
        color: color,
        status: status,
        has_title: !!title,
        content_length: content.length
      });
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

  const updateNote = async (id: string, title: string, content: string, status: StickyNoteStatus, color: string) => {
    try {
      const updatedNote = await updateNoteService(id, { 
        title: title || undefined,
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
        setFilteredNotes(prevNotes => 
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
        setFilteredNotes(prevNotes =>
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
      setFilteredNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      setDetailDialogOpen(false);
      toast.success('Note deleted!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const reorderNotes = async (fromIndex: number, toIndex: number) => {
    try {
      const allUnpinnedNotes = notes.filter(note => !note.pinned);
      const allPinnedNotes = notes.filter(note => note.pinned);
      
      // Find the actual note being moved by getting the corresponding note from the full notes list
      const filteredUnpinnedNotes = filteredNotes.filter(note => !note.pinned);
      const movedNote = filteredUnpinnedNotes[fromIndex];
      const actualNote = allUnpinnedNotes.find(n => n.id === movedNote.id);
      
      if (!actualNote) return;
      
      // Find the actual index in the full notes array
      const actualFromIndex = allUnpinnedNotes.findIndex(n => n.id === actualNote.id);
      
      // Create a copy of all unpinned notes and remove the dragged note
      const reorderedUnpinned = [...allUnpinnedNotes];
      reorderedUnpinned.splice(actualFromIndex, 1); // Remove the dragged note
      
      // Find the actual position where we want to insert
      // If dropping on a note after the dragged note's original position, we need to adjust the index
      let actualToIndex = toIndex;
      if (actualFromIndex < toIndex) {
        // If moving forward, the index shifts by 1 after removal
        actualToIndex = toIndex + 1;
      }
      
      // Insert the dragged note at the new position
      reorderedUnpinned.splice(actualToIndex, 0, actualNote);
      
      // Combine pinned notes (always first) with reordered unpinned notes
      const newOrder = [...allPinnedNotes, ...reorderedUnpinned];
      
      // Update the database
      await reorderNotesService(newOrder);
      
      // Update local state
      setNotes(newOrder);
      setFilteredNotes(newOrder);
      toast.success('Note moved!');
    } catch (error) {
      console.error('Error reordering notes:', error);
      toast.error('Failed to reorder notes');
    }
  };

  // Separate pinned and unpinned notes for drag and drop
  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.pinned);
  
  const {
    draggedItem,
    dragOverIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseOver,
    handleMouseLeave,
  } = useDragAndDrop(unpinnedNotes, reorderNotes);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Track search events
    if (query.trim()) {
      analytics.track(AnalyticsEvents.SEARCH_PERFORMED, {
        query_length: query.length,
        query_type: 'text_search'
      });
    }
  };

  const handleQuickNote = async (content: string, color: string) => {
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to create notes");
      return;
    }
    setStickyNoteWindowOpen(false);
    
    if (content.trim()) {
      try {
        const newNote = await createNoteService({
          content: content.trim(),
          color: color || "yellow",
          status: "To-Do",
          pinned: false,
          lastUpdated: Date.now()
        });
        
        setNotes(prevNotes => [newNote, ...prevNotes]);
        setFilteredNotes(prevNotes => [newNote, ...prevNotes]);
        
        // Load reactions for the new note immediately
        await loadReactions([newNote]);
        
        toast.success('Sticky note added!');
      } catch (error) {
        console.error('Error creating sticky note:', error);
        toast.error('Failed to add sticky note');
      }
    }
  };

  const handleNoteClick = (note: Note) => {
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to view notes");
      return;
    }
    
    // Only open detail dialog - don't toggle selection
    setSelectedNote(note);
    setDetailDialogOpen(true);
  };

  const handleToggleSelect = (noteId: string) => {
    const newSelectedNotes = new Set(selectedNotes);
    if (newSelectedNotes.has(noteId)) {
      newSelectedNotes.delete(noteId);
    } else {
      newSelectedNotes.add(noteId);
    }
    setSelectedNotes(newSelectedNotes);
  };

  const handleMassDelete = async () => {
    try {
      const notesToDelete = Array.from(selectedNotes);
      await Promise.all(notesToDelete.map(noteId => deleteNoteService(noteId)));
      
      setNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
      setFilteredNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
      
      // Clear selections
      setSelectedNotes(new Set());
      setShowMassDeleteDialog(false);
      
      toast.success(`Deleted ${notesToDelete.length} note${notesToDelete.length > 1 ? 's' : ''} successfully!`);
    } catch (error) {
      console.error('Error mass deleting notes:', error);
      toast.error('Failed to delete notes');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img 
                src="./stickee.png" 
                alt="Stickee" 
                className="h-14 w-14 object-contain icon-crisp no-select"
                onError={(e) => {
                  // Prevent infinite loop by setting a flag
                  const target = e.target as HTMLImageElement;
                  if (!target.dataset.errorHandled) {
                    target.dataset.errorHandled = "true";
                  }
                }}
              />
              <h1 className="text-4xl font-bold text-foreground tracking-tight font-handwriting">
                Stickee
              </h1>
              <p className="text-muted-foreground mt-1">
                Made by{" "}
                <a 
                  href="https://github.com/slammers001" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  slammers001
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar onSearch={termsAgreed ? handleSearch : () => {}} disabled={!termsAgreed} />
              <div className="h-6 w-px bg-border"></div>
              
              {/* Select All Button */}
              {filteredNotes.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedNotes.size === filteredNotes.length) {
                        setSelectedNotes(new Set());
                      } else {
                        setSelectedNotes(new Set(filteredNotes.map(note => note.id)));
                      }
                    }}
                  >
                    {selectedNotes.size === filteredNotes.length ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select All ({filteredNotes.length})
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {/* Mass Delete Button - appears when notes are selected */}
              {selectedNotes.size > 0 && (
                <>
                  <div className="h-6 w-px bg-border"></div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowMassDeleteDialog(true)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedNotes.size})
                  </Button>
                </>
              )}
              
              <div className="h-6 w-px bg-border"></div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                onClick={(e) => {
                  if (!termsAgreed) {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.error("You must agree to the Terms of Service to create notes");
                    return;
                  }
                  e.stopPropagation();
                  setDialogOpen(true);
                }}
                disabled={!termsAgreed}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="container mx-auto px-4 py-8">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            <img 
              src={searchQuery ? "./Stickee-Not-Found.png" : "./stickee.png"} 
              alt={searchQuery ? "No notes found" : "Stickee"} 
              className="mb-6 max-w-sm h-auto object-contain transition-all duration-200 hover:scale-110 hover:rotate-[-10deg] cursor-pointer"
              onClick={() => {
                if (!termsAgreed) {
                  toast.error("You must agree to the Terms of Service to create notes");
                  return;
                }
                setDialogOpen(true);
              }}
              onError={(e) => {
                console.error(`Failed to load ${searchQuery ? 'Stickee-Not-Found.png' : 'stickee.png'}`);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <h2 className="text-2xl font-semibold text-foreground mb-2 font-handwriting">
              {searchQuery ? "No matching notes found" : "No Stickee notes yet"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchQuery 
                ? `No notes found matching "${searchQuery}". Try a different search term or clear the search.`
                : "Click the Stickee icon to create your first Stickee note!"
              }
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {/* Pinned notes - not draggable */}
            {pinnedNotes.map((note) => (
              <StickyNote
                key={note.id}
                id={note.id}
                title={note.title}
                content={note.content}
                color={note.color}
                status={note.status}
                pinned={note.pinned}
                reactions={noteReactions[note.id] || []}
                onReactionUpdate={(reactions) => handleReactionUpdate(note.id, reactions)}
                onClick={() => handleNoteClick(note)}
                onTogglePin={() => togglePin(note.id)}
                onToggleSelect={() => handleToggleSelect(note.id)}
                isSelected={selectedNotes.has(note.id)}
                showSelectionCheckbox={selectedNotes.size > 0}
              />
            ))}
            {/* Unpinned notes - draggable */}
            {unpinnedNotes.map((note, index) => (
              <div
                key={note.id}
                onMouseDown={(e) => handleMouseDown(e, index, note.id)}
                onMouseMove={handleMouseMove}
                onMouseUp={() => handleMouseUp(index)}
                onMouseOver={() => handleMouseOver(index)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "transition-all duration-200 relative cursor-move",
                  draggedItem?.index === index ? "opacity-50" : ""
                )}
              >
                {/* Drop indicator line */}
                {dragOverIndex === index && (
                  <div className="absolute left-2 top-0 bottom-0 w-1 bg-primary rounded-full transition-all duration-200 z-10" />
                )}
                <StickyNote
                  id={note.id}
                  title={note.title}
                  content={note.content}
                  color={note.color}
                  status={note.status}
                  pinned={note.pinned}
                  reactions={noteReactions[note.id] || []}
                  onReactionUpdate={(reactions) => handleReactionUpdate(note.id, reactions)}
                  onClick={() => handleNoteClick(note)}
                  onTogglePin={() => togglePin(note.id)}
                  onToggleSelect={() => handleToggleSelect(note.id)}
                  isSelected={selectedNotes.has(note.id)}
                  showSelectionCheckbox={selectedNotes.size > 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Pinned notes - not draggable */}
            {pinnedNotes.map((note) => {
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
                    "p-4 bg-card border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative",
                    colorMap[note.color],
                    selectedNotes.has(note.id) && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => handleNoteClick(note)}
                >
                  {/* Selection Checkbox for List View */}
                  {selectedNotes.size > 0 && (
                    <div 
                      className="absolute top-2 right-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(note.id);
                      }}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                        selectedNotes.has(note.id)
                          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-background border-primary border-primary/50 hover:bg-primary/20"
                      )}>
                        {selectedNotes.has(note.id) && <CheckSquare className="w-4 h-4" />}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(note.id);
                        }}
                        className={cn(
                          "mt-1 flex-shrink-0 transition-colors pin-icon",
                          note.pinned 
                            ? "text-red-500 hover:text-red-600" 
                            : "text-foreground/40 hover:text-foreground/70"
                        )}
                      >
                        <Pin 
                          size={16} 
                          fill={note.pinned ? "currentColor" : "none"} 
                        />
                      </button>
                      <div className="flex-1">
                        {note.title && (
                          <h4 className="text-foreground font-title text-xl font-bold mb-1 leading-tight">
                            {note.title.length > 12 ? `${note.title.substring(0, 12)}...` : note.title}
                          </h4>
                        )}
                        <p className="text-foreground font-handwriting text-lg line-clamp-2 note-text">
                          {note.content}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-handwriting shrink-0 note-status dark:text-white", statusColors[note.status])}
                    >
                      {note.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {/* Unpinned notes - draggable */}
            {unpinnedNotes.map((note, index) => {
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
                <div key={note.id} className="relative">
                  {/* Drop indicator line */}
                  {dragOverIndex === index && (
                    <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-full transition-all duration-200 z-10" />
                  )}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, index, note.id)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => handleMouseUp(index)}
                    onMouseOver={() => handleMouseOver(index)}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                      "p-4 bg-card border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-move relative",
                      colorMap[note.color],
                      draggedItem?.index === index ? "opacity-50" : "",
                      selectedNotes.has(note.id) && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => handleNoteClick(note)}
                  >
                    {/* Selection Checkbox for List View */}
                    {selectedNotes.size > 0 && (
                      <div 
                        className="absolute top-2 right-2 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(note.id);
                        }}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                          selectedNotes.has(note.id)
                            ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90" 
                            : "bg-background border-primary border-primary/50 hover:bg-primary/20"
                        )}>
                          {selectedNotes.has(note.id) && <CheckSquare className="w-4 h-4" />}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(note.id);
                          }}
                          className={cn(
                            "mt-1 flex-shrink-0 transition-colors pin-icon",
                            note.pinned 
                              ? "text-red-500 hover:text-red-600" 
                              : "text-foreground/40 hover:text-foreground/70"
                          )}
                        >
                          <Pin 
                            size={16} 
                            fill={note.pinned ? "currentColor" : "none"} 
                          />
                        </button>
                        <div className="flex-1">
                          {note.title && (
                            <h4 className="text-foreground font-title text-xl font-bold mb-1 leading-tight">
                              {note.title.length > 12 ? `${note.title.substring(0, 12)}...` : note.title}
                            </h4>
                          )}
                          <p className="text-foreground font-handwriting text-lg line-clamp-2 note-text">
                            {note.content}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-handwriting shrink-0 note-status dark:text-white", statusColors[note.status])}
                      >
                        {note.status}
                      </Badge>
                    </div>
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
        <Suspense fallback={<div>Loading...</div>}>
          <NoteDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            note={selectedNote}
            onSave={updateNote}
            onDelete={deleteNote}
          />
        </Suspense>
      )}

      {/* Terms Popup */}
      {!termsAgreed && (
        <TermsPopup 
          onAgree={handleTermsAgree} 
          showTerms={showTermsDialog}
          onShowTermsChange={handleShowTermsDialog}
        />
      )}

      {/* Settings Dialog */}
      <Suspense fallback={<div>Loading...</div>}>
        <SettingsDialog 
          open={settingsOpen} 
          onOpenChange={setSettingsOpen}
        />
      </Suspense>
      
      <Suspense fallback={<div>Loading...</div>}>
        <StickyNoteWindow
          isOpen={stickyNoteWindowOpen}
          onClose={handleQuickNote}
        />
      </Suspense>

      {/* Checklist */}
      <Suspense fallback={<div>Loading...</div>}>
        <Checklist
          items={checklistItems}
          isOpen={isChecklistOpen}
          onAdd={addChecklistItem}
          onToggle={toggleChecklistItem}
          onUpdate={updateChecklistItem}
          onDelete={deleteChecklistItem}
          onToggleOpen={toggleChecklist}
        />
      </Suspense>

      {/* Mass Delete Dialog */}
      <MassDeleteDialog
        open={showMassDeleteDialog}
        selectedCount={selectedNotes.size}
        onConfirm={handleMassDelete}
        onCancel={() => setShowMassDeleteDialog(false)}
      />

      {/* Version Display */}
      <div className="fixed bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded shadow-sm" style={{ fontFamily: 'var(--font-family-handwriting)' }}>
        Version 1.2.0
      </div>
    </div>
  );
};


