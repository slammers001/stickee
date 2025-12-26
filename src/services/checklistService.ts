import { supabase } from '@/lib/supabase';
import { ChecklistItem } from '@/types/checklist';

const TABLE_NAME = 'checklist_items';

export const checklistService = {
  async getItems(userId: string): Promise<ChecklistItem[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      throw error;
    }
  },

  async addItem(userId: string, text: string): Promise<ChecklistItem> {
    try {
      const newItem = {
        user_id: userId,
        text: text.trim(),
        completed: false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding checklist item:', error);
      throw error;
    }
  },

  async toggleItem(id: string, completed: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      throw error;
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      throw error;
    }
  },

  async updateItem(id: string, text: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ text: text.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      throw error;
    }
  },

  async reorderItems(updatedItems: ChecklistItem[]): Promise<void> {
    try {
      const updates = updatedItems.map((item, index) => ({
        id: item.id,
        position: index,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from(TABLE_NAME).upsert(updates, {
        onConflict: 'id',
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error reordering checklist items:', error);
      throw error;
    }
  },
};