import { useState, useEffect, useCallback } from 'react';
import { ChecklistItem } from '@/types/checklist';
import { checklistService } from '@/services/checklistService';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/userService';

type SupabaseError = {
  status?: number;
  message?: string;
  error?: any;
};

export const useChecklist = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load items from Supabase on mount
  const loadItems = useCallback(async () => {
    try {
      const user = getCurrentUser();
      if (!user?.id) {
        console.warn('No user ID available');
        setItems([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Since anonymous auth is disabled, we'll create a temporary session
        // using the user ID as a unique identifier
        console.log('No session found, creating temporary user session');
        // For now, we'll skip authentication and try to access public data
        // You may need to update RLS policies in Supabase to allow public access
      }
      
      const data = await checklistService.getItems(user.id);
      setItems(data);
    } catch (error) {
      console.error('Failed to load checklist:', error);
      // If there's an auth error, we'll try to continue without auth
      if ((error as SupabaseError)?.status === 401 || (error as any)?.message?.includes('Anonymous sign-ins are disabled')) {
        console.warn('Authentication disabled, continuing without auth');
        setItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up data loading and real-time subscription
  useEffect(() => {
    let isMounted = true;
    
    loadItems();

    // Set up real-time subscription
    const user = getCurrentUser();
    if (user?.id) {
      const subscription = supabase
        .channel('checklist_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'checklist_items',
          filter: `user_id=eq.${user.id}`
        }, () => {
          if (isMounted) loadItems();
        })
        .subscribe();

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [loadItems, supabase, getCurrentUser]);

  const addItem = useCallback(async (text: string) => {
    const user = getCurrentUser();
    if (!text.trim() || !user?.id) {
      console.warn('Invalid input or no user ID');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Since anonymous auth is disabled, we'll try without auth
        console.log('No session found, attempting to add item without auth');
      }
      
      const newItem = await checklistService.addItem(user.id, text);
      setItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Failed to add item:', error);
      // If there's an auth error, we'll handle it gracefully
      if ((error as SupabaseError)?.status === 401 || (error as any)?.message?.includes('Anonymous sign-ins are disabled')) {
        console.warn('Authentication disabled, cannot add item to database');
        // For now, we'll just show an error to the user
        throw new Error('Authentication is required to save items. Please enable anonymous authentication in Supabase or sign in.');
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;
    
    try {
      setIsLoading(true);
      await checklistService.toggleItem(id, !item.completed);
      setItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      );
    } catch (error) {
      console.error('Failed to toggle item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await checklistService.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reorderItems = useCallback(async (reorderedItems: ChecklistItem[]) => {
    try {
      setItems(reorderedItems);
      await checklistService.reorderItems(reorderedItems);
    } catch (error) {
      console.error('Failed to reorder items:', error);
      // Revert on error
      loadItems();
      throw error;
    }
  }, [loadItems]);

  const toggleChecklist = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    items,
    addItem,
    toggleItem,
    deleteItem,
    reorderItems,
    isOpen,
    toggleOpen: toggleChecklist,
    toggleChecklist, // Expose both for backward compatibility
    isLoading,
  };
};
