import { v4 as uuidv4 } from 'uuid';
import { Note, NoteStatus } from '@/types/note';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'stickee-notes';

// Generate a unique user ID if it doesn't exist
const getOrCreateUserId = (): string => {
  let userId = localStorage.getItem('stickee-user-id');
  if (!userId) {
    userId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('stickee-user-id', userId);
  }
  return userId;
};

// Helper function to map Supabase note to our Note type
const mapSupabaseNote = (note: any): Note => ({
  id: note.id,
  content: note.content,
  color: note.color,
  status: note.status as NoteStatus,
  lastUpdated: note.last_updated || Date.now(),
  pinned: note.pinned || false,
  user_id: note.user_id || getOrCreateUserId()
});

// Get all notes for the current user
export const getNotes = async (): Promise<Note[]> => {
  try {
    // Try to fetch from Supabase first
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .order('pinned', { ascending: false })
      .order('last_updated', { ascending: false });

    if (error) throw error;
    
    // If we have notes from Supabase, return them
    if (notes && notes.length > 0) {
      return notes.map(mapSupabaseNote);
    }
    
    // Fallback to local storage if no notes in Supabase
    const userId = getOrCreateUserId();
    const localData = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    return localData ? JSON.parse(localData) : [];
  } catch (error) {
    console.error('Error fetching notes from Supabase, falling back to local storage:', error);
    // Fallback to local storage on error
    const userId = getOrCreateUserId();
    const localData = localStorage.getItem(`${STORAGE_KEY}-${userId}`);
    return localData ? JSON.parse(localData) : [];
  }
};

// Save all notes for the current user to local storage
const saveNotesToLocal = async (notes: Note[]): Promise<void> => {
  const userId = getOrCreateUserId();
  localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(notes));
};

// Create a new note
export const createNote = async (noteData: Omit<Note, 'id' | 'lastUpdated' | 'user_id'>): Promise<Note> => {
  const newNote = {
    ...noteData,
    id: uuidv4(),
    last_updated: Date.now(),
    user_id: getOrCreateUserId(),
  };

  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single();

    if (error) throw error;
    return mapSupabaseNote(data);
  } catch (error) {
    console.error('Error creating note in Supabase, falling back to local storage:', error);
    // Fallback to local storage
    const notes = await getNotes();
    const localNote: Note = {
      ...newNote,
      lastUpdated: Date.now(),
    };
    await saveNotesToLocal([localNote, ...notes]);
    return localNote;
  }
};

// Update an existing note
export const updateNote = async (id: string, updates: Partial<Omit<Note, 'id'>>): Promise<Note | null> => {
  const updateData = {
    ...updates,
    last_updated: Date.now(),
  };

  try {
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapSupabaseNote(data);
  } catch (error) {
    console.error('Error updating note in Supabase, falling back to local storage:', error);
    // Fallback to local storage
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) return null;
    
    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      lastUpdated: Date.now(),
    };
    
    notes[noteIndex] = updatedNote;
    await saveNotesToLocal(notes);
    return updatedNote;
  }
};

// Delete a note
export const deleteNote = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting note from Supabase, falling back to local storage:', error);
    // Fallback to local storage
    const notes = await getNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    await saveNotesToLocal(filteredNotes);
    return true;
  }
};

// Update note status
export const updateNoteStatus = async (id: string, status: NoteStatus): Promise<Note | null> => {
  return updateNote(id, { status });
};

// Toggle pin status
export const updateNotePinStatus = async (id: string, pinned: boolean): Promise<Note | null> => {
  return updateNote(id, { pinned });
};
