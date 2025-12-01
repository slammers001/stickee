import { Note, NoteStatus } from '@/types/note';
import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';

// Helper function to map Supabase note to our Note type
const mapSupabaseNote = (note: any): Note => {
  // Safely get the timestamp, trying different possible column names
  const timestamp = note.last_updated || note.updated_at || note.created_at || new Date().toISOString();
  
  return {
    id: note.id,
    content: note.content || '',
    color: note.color || '#ffffff',
    status: (note.status as NoteStatus) || 'To-Do',
    lastUpdated: typeof timestamp === 'string' ? Date.parse(timestamp) : timestamp,
    pinned: Boolean(note.pinned),
    last_updated: timestamp, // For Supabase compatibility
    created_at: note.created_at || timestamp, // For Supabase compatibility
    user_id: note.user_id // Include user_id in the returned object
  };
};

// Get all notes for the current user
export const getNotes = async (): Promise<Note[]> => {
  try {
    const userId = getUserId();
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId) // Only get notes for current user
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return notes ? notes.map(mapSupabaseNote) : [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

// Create a new note
export const createNote = async (noteData: Omit<Note, 'id'>): Promise<Note> => {
  // Declare cleanNote in the outer scope so it's available in the catch block
  let cleanNote: Record<string, any> | null = null;
  
  try {
    // Get current user ID from our local service
    const userId = getUserId();
    
    // Prepare the note data to send to Supabase
    const noteDataToSend = {
      content: noteData.content,
      color: noteData.color,
      status: noteData.status,
      pinned: noteData.pinned,
      updated_at: new Date().toISOString(),
      user_id: userId // Always include user_id from our local service
    };

    // Remove undefined values
    cleanNote = Object.fromEntries(
      Object.entries(noteDataToSend)
        .filter(([_, v]) => v !== undefined)
    ) as Record<string, any>;

    const { data, error } = await supabase
      .from('notes')
      .insert([cleanNote])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to create note: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from Supabase');
    }
    
    return mapSupabaseNote(data);
  } catch (error) {
    console.error('Error in createNote:', {
      error,
      cleanNote,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

// Update an existing note
export const updateNote = async (id: string, updates: Partial<Omit<Note, 'id'>>): Promise<Note | null> => {
  const userId = getUserId();
  
  // Create update data with proper field names for Supabase
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Remove fields that shouldn't be sent to Supabase
  delete updateData.lastUpdated;
  delete updateData.last_updated;
  
  // Remove any undefined values
  const cleanUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  );

  try {
    const { data, error } = await supabase
      .from('notes')
      .update(cleanUpdateData)
      .eq('id', id)
      .eq('user_id', userId) // Ensure we only update the user's own note
      .select()
      .single();

    if (error) throw error;
    return data ? mapSupabaseNote(data) : null;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (id: string): Promise<boolean> => {
  const userId = getUserId();
  
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Ensure we only delete the user's own note

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
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
