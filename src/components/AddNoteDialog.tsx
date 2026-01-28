import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NoteStatus } from "@/components/StickyNote";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { cn } from "@/lib/utils";
import { soundEffects } from "@/utils/soundEffects";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { Mic, MicOff } from "lucide-react";

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, content: string, status: NoteStatus, color: string) => void;
}

const colors = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const statuses: NoteStatus[] = ["To-Do", "Doing", "Done"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  "Backlog": "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
};

export const AddNoteDialog = ({ open, onOpenChange, onSave }: AddNoteDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<NoteStatus>("To-Do");
  const [color, setColor] = useState(colors[0]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const {
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setCallbacks
  } = useVoiceRecognition();

  const hasUnsavedChanges = title.trim() !== "" || content.trim() !== "";

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(newOpen);
    if (!newOpen) {
      // Reset form when closing successfully
      setTitle("");
      setContent("");
      setStatus("To-Do");
      setColor(colors[0]);
    }
  };

  const handleSaveAndClose = () => {
    if (content.trim()) {
      soundEffects.playNewNoteSound();
      onSave(title.trim(), content, status, color);
      // Reset form after successful save
      setTitle("");
      setContent("");
      setStatus("To-Do");
      setColor(colors[0]);
      setShowUnsavedDialog(false);
      onOpenChange(false);
    }
  };

  const handleDiscardAndClose = () => {
    setTitle("");
    setContent("");
    setStatus("To-Do");
    setColor(colors[0]);
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleCancelUnsaved = () => {
    setShowUnsavedDialog(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Limit to 1500 characters
    if (value.length <= 1500) {
      setContent(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to 20 characters
    if (value.length <= 20) {
      setTitle(value);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Ctrl+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const handleSave = () => {
    console.log('handleSave called'); // Debug log
    console.log('Content to save:', content); // Debug log
    console.log('Content trimmed:', content.trim()); // Debug log
    
    if (content.trim()) {
      console.log('Saving note...'); // Debug log
      soundEffects.playNewNoteSound();
      onSave(title.trim(), content, status, color);
      // Reset form after successful save
      setTitle("");
      setContent("");
      setStatus("To-Do");
      setColor(colors[0]);
      onOpenChange(false);
    } else {
      console.log('No content to save - save cancelled'); // Debug log
    }
  };

  // Voice recognition setup
  useEffect(() => {
    setCallbacks(
      (result) => {
        if (result.isFinal) {
          handleVoiceResult(result.transcript);
        }
      },
      () => {
        setIsListening(false);
      }
    );
  }, [setCallbacks]);

  // Stop voice recording when dialog closes
  useEffect(() => {
    if (!open && isListening) {
      stopListening();
      setIsListening(false);
      resetTranscript();
    }
  }, [open, isListening]);

  // Reset transcript when dialog opens
  useEffect(() => {
    if (open) {
      resetTranscript();
    }
  }, [open]);

  const handleVoiceResult = (transcript: string) => {
    console.log('Voice result received:', transcript); // Debug log
    
    // Check for control commands first
    const normalizedText = transcript.toLowerCase().trim();
    console.log('Normalized text:', normalizedText); // Debug log
    
    if (normalizedText === 'save' || normalizedText === 'save changes' || normalizedText.includes('save')) {
      console.log('Save command detected'); // Debug log
      // Don't add "save" to content, just save the note
      handleSave();
      return;
    }
    
    if (normalizedText === 'close' || normalizedText === 'cancel' || normalizedText.includes('close')) {
      console.log('Close command detected'); // Debug log
      onOpenChange(false);
      return;
    }

    if (normalizedText === 'delete' || normalizedText === 'delete note' || normalizedText.includes('delete')) {
      console.log('Delete command detected'); // Debug log
      // For new notes, delete just means close without saving
      onOpenChange(false);
      return;
    }

    // Add content immediately (no stabilization delay)
    console.log('Adding content to note:', transcript); // Debug log
    setContent(prev => {
      const newContent = prev + (prev ? '\n' : '') + transcript;
      return newContent;
    });
    
    // Don't reset transcript here - let it naturally update
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      startListening();
      setIsListening(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Add a New Stickee Note</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="order-1 ml-2 mr-4">
            <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
            <Input
              placeholder="Add a title..."
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              className="font-title text-lg dark:text-white dark:placeholder:text-gray-400 max-w-md"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {title.length}/20 characters
            </div>
          </div>
          <div className="order-2 sm:order-3">
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap ml-2">
              {colors.map((c) => {
                const colorMap: Record<string, string> = {
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
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all border-2",
                      colorMap[c],
                      color === c ? "border-foreground scale-110" : "border-border hover:scale-105"
                    )}
                    aria-label={`Select ${c} color`}
                  />
                );
              })}
            </div>
          </div>
          <div className="order-3 sm:order-2">
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              placeholder="Type your note here..."
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="min-h-[150px] resize-none font-handwriting text-lg dark:text-white dark:placeholder:text-gray-400 w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Press Ctrl+Enter to save quickly • Maximum 1500 characters
            </p>
            
            {/* Voice Controls */}
            {isSupported && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isListening ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleListening}
                      className="transition-all duration-200"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    
                    {isListening && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-3 bg-red-500 rounded-full animate-pulse"
                              style={{
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '1s'
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-red-500">Listening...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Say: "save", "close", or "delete"
                  </div>
                </div>

                {/* Live Transcript */}
                {transcript && (
                  <div className="mt-2 p-2 bg-background rounded text-sm">
                    <div className="text-xs text-muted-foreground mb-1">Heard:</div>
                    <div>{transcript}</div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                    {error}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {content.length}/1500 characters
            </div>
          </div>
          <div className="order-4">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex gap-2">
              {statuses.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all font-handwriting text-base px-3 py-1 status-text",
                    status === s ? "selected" : "",
                    status === s ? statusColors[s] : "hover:bg-muted"
                  )}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setTitle("");
            setContent("");
            setStatus("To-Do");
            setColor(colors[0]);
            onOpenChange(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <UnsavedChangesDialog
      open={showUnsavedDialog}
      onSave={handleSaveAndClose}
      onDiscard={handleDiscardAndClose}
      onCancel={handleCancelUnsaved}
    />
    </>
  );
};
