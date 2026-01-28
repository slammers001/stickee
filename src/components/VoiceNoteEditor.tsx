import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceNoteEditorProps {
  onSave?: (title: string, content: string) => void;
  onClose?: () => void;
  initialContent?: string;
  initialTitle?: string;
}

export const VoiceNoteEditor = ({ 
  onSave, 
  onClose, 
  initialContent = '',
  initialTitle = ''
}: VoiceNoteEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isListening, setIsListening] = useState(false);
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [stableCount, setStableCount] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setCallbacks
  } = useVoiceRecognition();

  useEffect(() => {
    // Set up voice recognition callbacks
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

    return () => {
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [setCallbacks, processingTimeout]);

  useEffect(() => {
    // Auto-focus textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    
    // Auto-start voice recording when component mounts
    startListening();
    setIsListening(true);
  }, []);

  const handleVoiceResult = (transcript: string) => {
    // Clear any existing timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }

    // Check for control commands first
    const normalizedText = transcript.toLowerCase().trim();
    
    if (normalizedText.includes('save') || normalizedText.includes('save changes')) {
      handleSave();
      return;
    }
    
    if (normalizedText.includes('close') || normalizedText.includes('cancel')) {
      handleClose();
      return;
    }
    
    if (normalizedText.includes('delete') || normalizedText.includes('delete note')) {
      handleDelete();
      return;
    }

    // Check if transcript has stabilized
    if (transcript === lastTranscript) {
      setStableCount(prev => prev + 1);
    } else {
      setStableCount(1);
      setLastTranscript(transcript);
    }

    // Set a timeout to add content after speech stabilizes
    const timeout = setTimeout(() => {
      if (stableCount >= 2) {
        // Add the transcript to content
        setContent(prev => {
          const newContent = prev + (prev ? '\n' : '') + transcript;
          return newContent;
        });
        
        resetTranscript();
        setStableCount(0);
        setLastTranscript('');
      }
    }, 800);

    setProcessingTimeout(timeout);
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

  const handleSave = () => {
    if (onSave) {
      onSave(title, content);
    }
    toast.success('Note saved');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (onClose) {
      onClose();
    }
    toast.info('Note discarded');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 border rounded-lg bg-card">
        <p className="text-sm text-muted-foreground">
          Voice recording is not supported in this browser
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card shadow-lg p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Voice Note</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!content.trim()}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Title Input */}
      <input
        type="text"
        placeholder="Note title (optional)..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
        onKeyDown={handleKeyDown}
      />

      {/* Content Area */}
      <Textarea
        ref={textareaRef}
        placeholder="Start speaking or typing your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px] mb-4 resize-none"
        onKeyDown={handleKeyDown}
      />

      {/* Voice Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={toggleListening}
            className={cn(
              "transition-all duration-200",
              isListening && "animate-pulse bg-red-500 hover:bg-red-600"
            )}
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

        {/* Voice Commands Help */}
        <div className="text-xs text-muted-foreground">
          Say: "save", "close", or "delete"
        </div>
      </div>

      {/* Live Transcript */}
      {transcript && (
        <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
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
  );
};
