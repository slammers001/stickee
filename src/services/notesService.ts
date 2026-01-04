import { Note, NoteStatus } from '@/types/note';
import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import { encryptContent, decryptContent, encryptTitle, decryptTitle } from '@/utils/encryption';

// Helper function to map Supabase note to our Note type
const mapSupabaseNote = (note: any): Note => {
  // Safely get the timestamp, trying different possible column names
  const timestamp = note.last_updated || note.updated_at || note.created_at || new Date().toISOString();
  
  console.log('Loading note from database:', note);
  
  return {
    id: note.id,
    title: decryptTitle(note.title),
    content: decryptContent(note.content),
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
    const userId = await getUserId();
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId) // Only get notes for current user
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false }); // Newest first

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
    const userId = await getUserId();
    
    // Prepare the note data to send to Supabase
    const noteDataToSend = {
      title: encryptTitle(noteData.title),
      content: encryptContent(noteData.content),
      color: noteData.color,
      status: noteData.status,
      pinned: noteData.pinned,
      updated_at: new Date().toISOString(),
      user_id: userId // Always include user_id from our local service
    };

    console.log('Saving note with data:', noteDataToSend);

    // Remove undefined values but keep null values for database
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
    updated_at: new Date().toISOString(),
  };

  // Only include fields that exist in the database schema
  if (updates.content !== undefined) updateData.content = encryptContent(updates.content);
  if (updates.color !== undefined) updateData.color = updates.color;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.pinned !== undefined) updateData.pinned = updates.pinned;
  if (updates.title !== undefined) updateData.title = encryptTitle(updates.title);

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

// Reorder notes (update lastUpdated to maintain new order)
export const reorderNotes = async (notes: Note[]): Promise<void> => {
  try {
    const userId = getUserId();
    
    // Use a base timestamp and add index to create sequential order
    const baseTimestamp = Date.now() - 1000000; // Base timestamp in the past
    
    // Update all notes with new timestamps to reflect order
    const updates = notes.map((note, index) => {
      // Create sequential timestamps based on position
      const newTimestamp = baseTimestamp + (index * 1000); // 1 second intervals
      return supabase
        .from('notes')
        .update({ updated_at: new Date(newTimestamp).toISOString() }) // Use updated_at instead of last_updated
        .eq('id', note.id)
        .eq('user_id', userId);
    });

    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering notes:', error);
    throw error;
  }
};
