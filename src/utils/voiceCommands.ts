import type { Note } from '@/types/note';

export interface VoiceCommand {
  type: 'new_note' | 'edit_note' | 'show_archived' | 'content' | 'unknown';
  content?: string;
  noteIndex?: number;
  confidence: number;
}

export interface ParsedCommand {
  command: VoiceCommand;
  remainingText: string;
}

/**
 * Parse voice transcript into commands and content
 */
export const parseVoiceCommand = (transcript: string): ParsedCommand => {
  const normalizedText = transcript.toLowerCase().trim();
  
  // Command patterns - more flexible matching
  const patterns = {
    newNote: /^(new note|create note|add note)\b/,
    editNote: /^(edit note|modify note|update note)\s+(\d+|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)/,
    showArchived: /^(show archived|view archived|archived notes)/,
  };

  // Check for new note command - more flexible matching
  const newNoteMatch = normalizedText.match(patterns.newNote);
  if (newNoteMatch) {
    const remainingText = transcript.replace(patterns.newNote, '').trim();
    return {
      command: {
        type: 'new_note',
        confidence: 0.9
      },
      remainingText
    };
  }

  // Check for edit note command
  const editMatch = normalizedText.match(patterns.editNote);
  if (editMatch) {
    const noteIndexStr = editMatch[2];
    const noteIndex = parseNoteIndex(noteIndexStr);
    const remainingText = transcript.replace(patterns.editNote, '').trim();
    
    return {
      command: {
        type: 'edit_note',
        noteIndex,
        confidence: 0.9
      },
      remainingText
    };
  }

  // Check for show archived command
  if (patterns.showArchived.test(normalizedText)) {
    return {
      command: {
        type: 'show_archived',
        confidence: 0.9
      },
      remainingText: ''
    };
  }

  // If no specific command found, treat as content
  return {
    command: {
      type: 'content',
      content: transcript,
      confidence: 0.7
    },
    remainingText: transcript
  };
};

/**
 * Convert word numbers to digits
 */
const parseNoteIndex = (indexStr: string): number => {
  const wordToNumber: Record<string, number> = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4,
    'fifth': 5,
    'sixth': 6,
    'seventh': 7,
    'eighth': 8,
    'ninth': 9,
    'tenth': 10
  };

  // Check if it's a word number
  if (wordToNumber[indexStr]) {
    return wordToNumber[indexStr];
  }

  // Try to parse as number (convert to 0-based index)
  const num = parseInt(indexStr, 10);
  if (!isNaN(num) && num > 0) {
    return num;
  }

  return 1; // Default to first note
};

/**
 * Get note by voice command index
 */
export const getNoteByVoiceIndex = (notes: Note[], voiceIndex: number): Note | null => {
  // Convert 1-based voice index to 0-based array index
  const arrayIndex = voiceIndex - 1;
  
  if (arrayIndex >= 0 && arrayIndex < notes.length) {
    return notes[arrayIndex];
  }
  
  return null;
};

/**
 * Check if transcript contains only a command without content
 */
export const isCommandOnly = (transcript: string): boolean => {
  const normalizedText = transcript.toLowerCase().trim();
  const commandPatterns = [
    /^(new note|create note|add note)\s*$/,
    /^(edit note|modify note|update note)\s+(\d+|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s*$/,
    /^(show archived|view archived|archived notes)\s*$/
  ];

  return commandPatterns.some(pattern => pattern.test(normalizedText));
};

/**
 * Extract content from transcript when no specific command is found
 */
export const extractContent = (transcript: string): string => {
  // Remove common filler words and clean up
  const fillerWords = [
    'um', 'uh', 'like', 'you know', 'actually', 'basically', 
    'literally', 'right', 'so', 'well', 'I mean', 'okay'
  ];

  let cleaned = transcript.trim();
  
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Clean up extra spaces and punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[,\.\s]+|[,\.\s]+$/g, '');

  return cleaned;
};
