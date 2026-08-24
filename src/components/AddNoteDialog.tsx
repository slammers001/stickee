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
import { fireConfetti } from "@/utils/confetti";
import { Mic, MicOff } from "lucide-react";

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, content: string, status: NoteStatus, color: string) => void;
}

const colors = ["yellow", "pink", "blue", "green", "purple", "orange", "teal", "lavender", "peach", "mint"];

const statuses: NoteStatus[] = ["Backlog", "To-Do", "Doing", "Done"];

const statusColors: Record<NoteStatus, string> = {
  "To-Do": "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
  "Doing": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  "Done": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  "Backlog": "bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300",
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
      if (status === "Done") fireConfetti();
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
    if (content.trim()) {
      soundEffects.playNewNoteSound();
      if (status === "Done") fireConfetti();
      onSave(title.trim(), content, status, color);
      // Reset form after successful save
      setTitle("");
      setContent("");
      setStatus("To-Do");
      setColor(colors[0]);
      onOpenChange(false);
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
    
    if (normalizedText.includes('change status to')) {
      if (normalizedText.includes('done')) setStatus('Done');
      else if (normalizedText.includes('doing')) setStatus('Doing');
      else if (normalizedText.includes('todo') || normalizedText.includes('to-do') || normalizedText.includes('to do')) setStatus('To-Do');
      else if (normalizedText.includes('backlog')) setStatus('Backlog');
      return;
    }

    if (normalizedText.includes('save stickee') || normalizedText.includes('save sticky')) {
      handleSave();
      return;
    }
    
    if (normalizedText.includes('close stickee') || normalizedText.includes('close sticky')) {
      onOpenChange(false);
      return;
    }

    if (normalizedText.includes('delete stickee') || normalizedText.includes('delete sticky')) {
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
      <DialogContent className="sm:max-w-[591px] max-h-[90vh] flex flex-col mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Add a New Stickee Note</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-2 flex-1">
          <div className="order-1 ml-2 mr-4">
            <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
            <Input
              placeholder="Add a title..."
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              className="font-title text-base dark:text-white dark:placeholder:text-gray-400 max-w-md"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {title.length}/20 characters
            </div>
          </div>
          <div className="order-2 sm:order-3">
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex gap-1.5 flex-wrap ml-2">
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
                      "w-7 h-7 rounded-full transition-all border-2",
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
              className="min-h-[100px] resize-none font-handwriting text-base dark:text-white dark:placeholder:text-gray-400 w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Ctrl+Enter to save quickly • Maximum 1500 characters
            </p>
            
            {/* Voice Controls */}
            {isSupported && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isListening ? (
                      <button
                        onClick={toggleListening}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500 text-white text-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-3 bg-white rounded-full animate-pulse"
                              style={{
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '1s'
                              }}
                            />
                          ))}
                        </div>
                        <span>Listening…</span>
                      </button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleListening}
                        className="transition-all duration-200"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Recording
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Say: "Save stickee", "Close stickee", "Change status to …"
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
              {content.split(/\s+/).filter(Boolean).length} words • {content.length}/1500 characters
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
                    "cursor-pointer transition-all font-handwriting text-sm px-2.5 py-0.5 status-text",
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
