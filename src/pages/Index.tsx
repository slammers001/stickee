import { useState, useEffect, Suspense } from "react";
import { CheckSquare, Trash2, Settings, Plus, AlertCircle, Archive, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  getNotes as fetchNotes, 
  createNote as createNoteService, 
  updateNote as updateNoteService, 
  deleteNote as deleteNoteService,
  updateNotePinStatus as updateNotePinStatusService,
  reorderNotes as reorderNotesService
} from "@/services/notesService";
import { archiveNote } from "@/services/archiveService";
import { ensureUserExists, updateUserVersion } from "@/services/userService";
import { getReactionsForNote } from "@/services/emojiReactionService";
import { soundEffects } from "@/utils/soundEffects";
import type { ReactionSummary } from "@/types/emojiReaction";
import { TermsPopup } from "@/components/TermsPopup";
import { IssueReportButton } from "@/components/IssueReportButton";
import { IssueReportDialog } from "@/components/IssueReportDialog";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { SearchBar } from "@/components/SearchBar";
import { StickyNote } from "@/components/StickyNote";
import { AddNoteDialog } from "@/components/AddNoteDialog";
import { MassDeleteDialog } from "@/components/MassDeleteDialog";
import { useChecklist } from "@/hooks/useChecklist";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";
import type { StickyNoteStatus } from "@/types/note";
import { analytics, AnalyticsEvents } from "@/utils/analytics";
import { SettingsDialog } from "@/components/SettingsDialog";
import { NoteDetailDialog } from "@/components/NoteDetailDialog";
import { Checklist } from "@/components/Checklist";
import { StickyNoteWindow } from "@/components/StickyNoteWindow";
import { ArchivedNotesDialog } from "@/components/ArchivedNotesDialog";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

// Using the Note interface from types/note.ts

export default function Index() {
  const { isOpen: sidebarOpen, toggleSidebar, isCollapsed, toggleCollapse } = useSidebar();
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
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [noteReactions, setNoteReactions] = useState<Record<string, ReactionSummary[]>>({});
  const [showMassDeleteDialog, setShowMassDeleteDialog] = useState(false);
  const [archivedNotesDialogOpen, setArchivedNotesDialogOpen] = useState(false);
  
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

  // Apply saved font preference immediately on page load
  useEffect(() => {
    const applyFontFamily = (font: string) => {
      const root = document.documentElement;
      let fontValue = '';
      
      switch (font) {
        case "serif":
          fontValue = 'Georgia, serif';
          break;
        case "sans-serif":
          fontValue = 'Arial, sans-serif';
          break;
        case "monospace":
          fontValue = 'Courier New, monospace';
          break;
        case "give-you-glory":
          fontValue = '"Give You Glory", cursive';
          break;
        case "indie-flower":
          fontValue = '"Indie Flower", cursive';
          break;
        case "onest":
          fontValue = 'Onest, sans-serif';
          break;
        default:
          // For Google Fonts, use the display name directly
          fontValue = font.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          break;
      }
      
      // Load Google Font if needed
      if (font !== "serif" && font !== "sans-serif" && font !== "monospace") {
        const fontName = font.replace(/-/g, '+');
        const existingLink = document.querySelector(`link[href*="${fontName}"]`);
        
        if (!existingLink) {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      }
      
      root.style.setProperty('--font-family-base', fontValue);
      root.style.setProperty('--font-family-handwriting', fontValue);
    };

    // Load and apply the most recently saved fonts
    const savedFont = localStorage.getItem("stickee-font-family");
    const savedTitleFont = localStorage.getItem("stickee-title-font");
    
    if (savedFont) {
      applyFontFamily(savedFont);
    }
    
    // Apply title font
    if (savedTitleFont) {
      const root = document.documentElement;
      let titleFontValue = '';
      
      switch (savedTitleFont) {
        case "arbutus":
          titleFontValue = 'Arbutus, serif';
          break;
        case "agbalumo":
          titleFontValue = 'Agbalumo, display';
          break;
        case "walter-turncoat":
          titleFontValue = '"Walter Turncoat", cursive';
          break;
        case "yatra-one":
          titleFontValue = '"Yatra One", cursive';
          break;
      }
      
      // Load Google Font if needed
      if (savedTitleFont !== "arbutus") {
        const fontName = savedTitleFont.replace(/-/g, '+');
        const existingLink = document.querySelector(`link[href*="${fontName}"]`);
        
        if (!existingLink) {
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      }
      
      root.style.setProperty('--font-family-title', titleFontValue);
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

  // Load notes function
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

  // Load notes on component mount
  useEffect(() => {
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
      (note.title && note.title.toLowerCase().includes(query))
    );
    setFilteredNotes(filtered);
  }, [searchQuery, notes]);

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

  const addNote = async (title: string, content: string, status: StickyNoteStatus, color: string) => {
    try {
      // Play new note sound immediately
      soundEffects.playNewNoteSound();
      
      // Create a temporary note for immediate UI feedback
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempNote: Note = {
        id: tempId,
        title: title || undefined,
        content,
        color,
        status,
        pinned: false,
        lastUpdated: Date.now(),
        created_at: new Date().toISOString(),
        user_id: '', // Will be filled by the actual response
        isTemp: true // Mark as temporary
      };
      
      // Add to UI immediately
      setNotes(prevNotes => [tempNote, ...prevNotes]);
      setFilteredNotes(prevNotes => [tempNote, ...prevNotes]);
      setDialogOpen(false);
      
      // Create the actual note in the background
      const newNote = await createNoteService({
        title: title || undefined,
        content,
        color,
        status,
        pinned: false,
        lastUpdated: Date.now()
      });
      
      // Replace the temporary note with the real one
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === tempId ? { ...newNote, isTemp: false } : note
        )
      );
      setFilteredNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === tempId ? { ...newNote, isTemp: false } : note
        )
      );
      
      // Load reactions for the new note
      await loadReactions([newNote]);
      
      // Note added silently - no notification
      
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
        // Note updated silently - no notification
      }
    } catch (error) {
      console.error('Error updating note:', error);
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
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await deleteNoteService(id);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      setFilteredNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      setDetailDialogOpen(false);
      // Note deleted silently - no notification
    } catch (error) {
      console.error('Error deleting note:', error);
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
      // Note moved silently - no notification
    } catch (error) {
      console.error('Error reordering notes:', error);
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

  const handleQuickNote = async (content: string, color: string) => {
    if (!termsAgreed) {
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
        
        // Sticky note added silently - no notification
      } catch (error) {
        console.error('Error creating sticky note:', error);
      }
    }
  };

  const handleNoteClick = (note: Note) => {
    if (!termsAgreed) {
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
      
      // Notes deleted silently - no notification
    } catch (error) {
      console.error('Error mass deleting notes:', error);
    }
  };

  const handleArchive = async (noteId: string) => {
    try {
      // Play archive sound immediately
      soundEffects.playArchiveSound();
      
      // Remove from UI immediately for instant feedback
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      setFilteredNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Perform the actual archive operation
      await archiveNote(noteId);
      
      // Note archived silently - no notification
    } catch (error) {
      console.error('Error archiving note:', error);
      // Re-add the note to the list if there was an error
      await loadNotes();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 group p-2 bg-card border rounded-md shadow-md hover:bg-[hsl(var(--note-pink))] dark:hover:bg-[hsl(var(--note-pink)/0.8)] transition-colors"
      >
        <Menu className="h-5 w-5 text-black dark:text-white transition-colors" />
      </button>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        onToggleCollapse={toggleCollapse}
      />

      {/* Header */}
      <header className={cn(
        "border-b bg-card shadow-sm transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-shrink-0">
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
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight font-handwriting">
                  Stickee
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
            </div>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto flex-shrink-0">
              <SearchBar onSearch={termsAgreed ? handleSearch : () => {}} disabled={!termsAgreed} />
              <div className="h-6 w-px bg-border hidden md:block"></div>
              
              {/* Mobile Issue Icon Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIssueDialogOpen(true)}
                className="md:hidden flex-shrink-0"
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
              
              {/* Select All Button - Hidden on mobile and tablet */}
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
                    className="hidden md:flex"
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

              {/* Archive Button - Desktop only, shown when no notes are selected */}
              {selectedNotes.size === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchivedNotesDialogOpen(true)}
                  className="hidden md:flex"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archived Notes
                </Button>
              )}
              
              {/* Mass Delete Button - appears when notes are selected */}
              {selectedNotes.size > 0 && (
                <>
                  <div className="h-6 w-px bg-border"></div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowMassDeleteDialog(true)}
                    className="bg-red-500 hover:bg-red-600 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Delete ({selectedNotes.size})</span>
                    <span className="sm:hidden">({selectedNotes.size})</span>
                  </Button>
                </>
              )}
              
              <div className="h-6 w-px bg-border hidden md:block"></div>
              
              {/* Issue Report Button - Hidden on mobile */}
              <IssueReportButton 
                size="sm"
                className="hidden md:flex flex-1 md:flex-none"
              />
              
              <div className="h-6 w-px bg-border hidden md:block"></div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="hidden md:flex"
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
                className="bg-primary hover:bg-primary/90 flex-shrink-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className={cn(
        "container mx-auto px-4 py-8 transition-all duration-300",
        isCollapsed ? "md:ml-16" : "md:ml-64"
      )}>
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
        ) : (
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
                onArchive={() => handleArchive(note.id)}
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
                  onArchive={() => handleArchive(note.id)}
                  onToggleSelect={() => handleToggleSelect(note.id)}
                  isSelected={selectedNotes.has(note.id)}
                  showSelectionCheckbox={selectedNotes.size > 0}
                />
              </div>
            ))}
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
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
      />
      
      <StickyNoteWindow
        isOpen={stickyNoteWindowOpen}
        onClose={handleQuickNote}
      />

      {/* Checklist */}
      <Checklist
        items={checklistItems}
        isOpen={isChecklistOpen}
        onAdd={addChecklistItem}
        onToggle={toggleChecklistItem}
        onUpdate={updateChecklistItem}
        onDelete={deleteChecklistItem}
        onToggleOpen={toggleChecklist}
      />

      {/* Mass Delete Dialog */}
      <MassDeleteDialog
        open={showMassDeleteDialog}
        selectedCount={selectedNotes.size}
        onConfirm={handleMassDelete}
        onCancel={() => setShowMassDeleteDialog(false)}
      />

      {/* Issue Report Dialog */}
      <IssueReportDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
      />

      {/* Archived Notes Dialog */}
      <Suspense fallback={<div>Loading...</div>}>
        <ArchivedNotesDialog
          open={archivedNotesDialogOpen}
          onOpenChange={setArchivedNotesDialogOpen}
          onNotesRefresh={loadNotes}
        />
      </Suspense>

      {/* Version Display */}
      <div className="fixed bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded shadow-sm" style={{ fontFamily: 'var(--font-family-handwriting)' }}>
        Version 2.0.0
      </div>
    </div>
  );
};


