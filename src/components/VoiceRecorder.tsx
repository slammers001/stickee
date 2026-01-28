import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { parseVoiceCommand } from '@/utils/voiceCommands';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onCommand?: (command: any, remainingText: string) => void;
  onTranscript?: (transcript: string) => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceRecorder = ({ 
  onCommand, 
  onTranscript, 
  className,
  disabled = false 
}: VoiceRecorderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [stableCount, setStableCount] = useState(0);
  const {
    isListening,
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
        setIsProcessing(false);
      }
    );

    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [setCallbacks, processingTimeout]);

  const handleVoiceResult = (transcript: string) => {
    // Clear any existing timeout
    if (processingTimeout) {
      clearTimeout(processingTimeout);
    }

    // Check if transcript has stabilized (no changes for 2 consecutive checks)
    if (transcript === lastTranscript) {
      setStableCount(prev => prev + 1);
    } else {
      setStableCount(1);
      setLastTranscript(transcript);
    }

    setIsProcessing(true);
    
    // Call transcript callback if provided
    if (onTranscript) {
      onTranscript(transcript);
    }

    // Set a timeout to process the command after speech stabilizes
    const timeout = setTimeout(() => {
      // Only process if transcript has been stable for at least 2 checks
      if (stableCount >= 2) {
        // Use requestAnimationFrame for non-blocking processing
        requestAnimationFrame(() => {
          // Parse the voice command
          const { command, remainingText } = parseVoiceCommand(transcript);
          
          // Call command callback if provided (deferred for INP)
          if (onCommand) {
            setTimeout(() => {
              onCommand(command, remainingText);
            }, 0);
          }

          // Show toast feedback for the command (deferred for INP)
          setTimeout(() => {
            showCommandFeedback(command, remainingText);
          }, 0);
          
          // Reset transcript after processing
          resetTranscript();
          setIsProcessing(false);
          setStableCount(0);
          setLastTranscript('');
        });
      } else {
        // If not stable yet, wait longer
        setIsProcessing(false);
      }
    }, 1200); // Balanced delay for complete speech capture and good INP

    setProcessingTimeout(timeout);
  };

  const showCommandFeedback = (command: any, remainingText: string) => {
    switch (command.type) {
      case 'new_note':
        toast.success('Creating new note' + (remainingText ? `: "${remainingText}"` : ''));
        // Don't speak to avoid interference with next voice command
        break;
      case 'edit_note':
        toast.success(`Editing note ${command.noteIndex}` + (remainingText ? `: "${remainingText}"` : ''));
        // Don't speak to avoid interference
        break;
      case 'show_archived':
        toast.success('Showing archived notes');
        // Don't speak to avoid interference
        break;
      case 'content':
        toast.info('New note created');
        // Don't speak to avoid interference
        break;
      default:
        toast.info('Voice command recognized');
        // Don't speak to avoid interference
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      // Don't speak when stopping to avoid interference
    } else {
      startListening();
      // Remove voice feedback to avoid interference with speech recognition
    }
  };

  if (!isSupported) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="text-muted-foreground"
        >
          <MicOff className="h-4 w-4 mr-2" />
          Voice not supported
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={toggleListening}
          disabled={disabled || isProcessing}
          className={cn(
            "relative transition-all duration-200",
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
              Start Voice
            </>
          )}
        </Button>
        
        {isListening && (
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="text-sm text-red-500 font-medium">Listening...</span>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* Live transcript display */}
      {transcript && (
        <div className="w-full max-w-md">
          <div className="bg-muted/50 border rounded-lg p-3">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {isListening ? 'Listening...' : 'Heard:'}
            </div>
            <div className="text-sm text-foreground">
              {transcript}
            </div>
            {isProcessing && (
              <div className="mt-2 text-xs text-blue-500">
                Processing command...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual feedback when listening */}
      {isListening && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-4 bg-red-500 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
