import { useState, useEffect, useCallback } from 'react';
import { ChecklistItem } from '@/types/checklist';
import { checklistService } from '@/services/checklistService';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/services/userService';
import { toast } from 'sonner';

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
    // Check if terms are agreed
    const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";
    if (!termsAgreed) {
      console.warn('Terms not agreed, skipping checklist loading');
      setItems([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const user = await getCurrentUser();
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

  // Set up data loading (realtime disabled)
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = useCallback(async (text: string, date?: string): Promise<boolean> => {
    const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return false;
    }

    const user = await getCurrentUser();
    if (!text.trim() || !user?.id) {
      toast.error('Sign in to add tasks');
      return false;
    }

    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, attempting to add item without auth');
      }

      const newItem = await checklistService.addItem(user.id, text, date);
      setItems(prev => [...prev, newItem]);
      return true;
    } catch (error) {
      console.error('Failed to add item:', error);
      if (
        (error as SupabaseError)?.status === 401 ||
        (error as { message?: string })?.message?.includes('Anonymous sign-ins are disabled')
      ) {
        toast.error('Authentication is required to save tasks. Please sign in.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to add task');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    // Check if terms are agreed
    const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    
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

  const updateItem = useCallback(async (id: string, text: string) => {
    // Check if terms are agreed
    const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    
    if (!text.trim()) return;
    
    try {
      setIsLoading(true);
      await checklistService.updateItem(id, text);
      setItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, text: text.trim() } : item
        )
      );
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    // Check if terms are agreed
    const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    
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
    // Check if terms are agreed
    const termsAgreed = localStorage.getItem("stickee-terms-agreed") === "true";
    if (!termsAgreed) {
      toast.error("You must agree to the Terms of Service to use the checklist");
      return;
    }
    
    setIsOpen(prev => !prev);
  }, []);

  return {
    items,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    reorderItems,
    isOpen,
    toggleOpen: toggleChecklist,
    toggleChecklist, // Expose both for backward compatibility
    isLoading,
  };
};
