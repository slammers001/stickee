import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
}

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export const useVoiceRecognition = () => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    isSupported: false,
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const onResultCallback = useRef<((result: VoiceRecognitionResult) => void) | null>(null);
  const onEndCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Speech recognition is not supported in this browser'
      }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1; // Reduce processing load

    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        transcript: ''
      }));
    };

    recognition.onresult = (event: any) => {
      // Use requestAnimationFrame to non-blocking processing
      requestAnimationFrame(() => {
        // Process only the latest result to avoid accumulation
        const latestResult = event.results[event.results.length - 1];
        
        if (latestResult.isFinal) {
          const transcript = latestResult[0].transcript;
          
          setState(prev => ({
            ...prev,
            transcript: transcript
          }));
          
          if (onResultCallback.current) {
            setTimeout(() => {
              onResultCallback.current?.({
                transcript: transcript,
                confidence: latestResult[0].confidence,
                isFinal: true
              });
            }, 0);
          }
        } else {
          // Update with interim result for live display
          const interimTranscript = latestResult[0].transcript;
          
          setState(prev => ({
            ...prev,
            transcript: interimTranscript
          }));
        }
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: `Speech recognition error: ${event.error}`
      }));
    };

    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false
      }));
      
      if (onEndCallback.current) {
        onEndCallback.current();
      }
    };

    recognitionRef.current = recognition;
    setState(prev => ({
      ...prev,
      isSupported: true
    }));

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && state.isSupported) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to start speech recognition'
        }));
      }
    }
  }, [state.isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      error: null
    }));
  }, []);

  const setCallbacks = useCallback((
    onResult?: (result: VoiceRecognitionResult) => void,
    onEnd?: () => void
  ) => {
    onResultCallback.current = onResult || null;
    onEndCallback.current = onEnd || null;
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    setCallbacks
  };
};
