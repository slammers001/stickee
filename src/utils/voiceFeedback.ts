export class VoiceFeedback {
  private synthesis: SpeechSynthesis;
  private isSupported: boolean;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
  }

  /**
   * Speak text using text-to-speech
   */
  speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) {
    if (!this.isSupported) {
      console.warn('Text-to-speech is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    // Try to use a preferred voice
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang.includes('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);
  }

  /**
   * Stop any ongoing speech
   */
  stop() {
    if (this.isSupported) {
      this.synthesis.cancel();
    }
  }

  /**
   * Check if voice feedback is supported
   */
  getIsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Predefined feedback messages
   */
  feedback = {
    newNoteCreated: (content?: string) => {
      const message = content 
        ? `New note created with content: ${content}`
        : 'New note created';
      this.speak(message);
    },
    
    noteOpened: (noteNumber: number) => {
      this.speak(`Note ${noteNumber} opened for editing`);
    },
    
    archivedNotesShown: () => {
      this.speak('Archived notes displayed');
    },
    
    contentAdded: () => {
      this.speak('Content added to note');
    },
    
    commandNotRecognized: () => {
      this.speak('Voice command not recognized');
    },
    
    error: (message: string) => {
      this.speak(`Error: ${message}`);
    },
    
    listeningStarted: () => {
      this.speak('Listening for voice commands');
    },
    
    listeningStopped: () => {
      this.speak('Voice recording stopped');
    }
  };
}

// Create a singleton instance
export const voiceFeedback = new VoiceFeedback();
