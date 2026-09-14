import { Note } from '@/types/note';
import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import { decryptContent, decryptTitle } from '@/utils/encryption';

// Get all trashed notes for the current user
export const getTrashedNotes = async (): Promise<Note[]> => {
  try {
    const userId = await getUserId();
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }); // Most recently deleted first

    if (error) {
      // If deleted_at column doesn't exist, return empty array
      if (error.message?.includes('deleted_at') || error.code === '42703') {
        console.warn('deleted_at column not found, trash is not available');
        return [];
      }
      throw error;
    }
    
    if (!notes) return [];
    
    return notes.map((note: any) => ({
      id: note.id,
      title: decryptTitle(note.title),
      content: decryptContent(note.content),
      color: note.color || '#ffffff',
      status: note.status || 'To-Do',
      lastUpdated: typeof note.updated_at === 'string' ? Date.parse(note.updated_at) : note.updated_at,
      pinned: Boolean(note.pinned),
      last_updated: note.updated_at,
      created_at: note.created_at,
      user_id: note.user_id,
      archived: Boolean(note.archived),
      archived_at: note.archived_at,
      deleted_at: note.deleted_at
    }));
  } catch (error) {
    console.error('Error fetching trashed notes:', error);
    return [];
  }
};

// Restore a note from trash
export const restoreFromTrash = async (id: string): Promise<boolean> => {
  const userId = await getUserId();
  
  try {
    const { error } = await supabase
      .from('notes')
      .update({ 
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error restoring note from trash:', error);
    throw error;
  }
};

// Permanently delete a trashed note
export const permanentDeleteNote = async (id: string): Promise<boolean> => {
  const userId = await getUserId();
  
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    throw error;
  }
};

// Empty trash (permanently delete all trashed notes)
export const emptyTrash = async (): Promise<boolean> => {
  const userId = await getUserId();
  
  try {
    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null);

    if (fetchError) {
      // If deleted_at column doesn't exist, nothing to empty
      if (fetchError.message?.includes('deleted_at') || fetchError.code === '42703') {
        return true;
      }
      throw fetchError;
    }

    if (!notes || notes.length === 0) return true;

    const ids = notes.map(n => n.id);
    const { error } = await supabase
      .from('notes')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error emptying trash:', error);
    throw error;
  }
};
