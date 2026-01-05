import { Note } from '@/types/note';
import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';
import { decryptContent, decryptTitle } from '@/utils/encryption';

// Archive a note
export const archiveNote = async (id: string): Promise<boolean> => {
  const userId = await getUserId();
  
  try {
    const { error } = await supabase
      .from('notes')
      .update({ 
        archived: true,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error archiving note:', error);
    throw error;
  }
};

// Unarchive a note
export const unarchiveNote = async (id: string): Promise<boolean> => {
  const userId = await getUserId();
  
  try {
    const { error } = await supabase
      .from('notes')
      .update({ 
        archived: false,
        archived_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unarchiving note:', error);
    throw error;
  }
};

// Get archived notes for the current user
export const getArchivedNotes = async (): Promise<Note[]> => {
  try {
    const userId = await getUserId();
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', true)
      .order('archived_at', { ascending: false }); // Most recently archived first

    if (error) throw error;
    
    if (!notes) return [];
    
    // Map Supabase notes to our Note type
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
      archived_at: note.archived_at
    }));
  } catch (error) {
    console.error('Error fetching archived notes:', error);
    return [];
  }
};

// Permanently delete an archived note
export const deleteArchivedNote = async (id: string): Promise<boolean> => {
  const userId = await getUserId();
  
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('archived', true); // Only allow deletion of archived notes

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting archived note:', error);
    throw error;
  }
};
