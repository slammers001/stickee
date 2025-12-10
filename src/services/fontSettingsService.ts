import { supabase } from '@/lib/supabase';
import { getUserId } from './userService';

export interface FontSettings {
  id: string;
  user_id: string;
  current_font: string;
  title_font: string;
  favorite_fonts: string[];
  created_at: string;
  updated_at: string;
}

export const getFontSettings = async (): Promise<FontSettings | null> => {
  const userId = getUserId();
  
  try {
    // Use .maybeSingle() instead of .single() to handle no results gracefully
    const { data, error } = await supabase
      .from('font_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching font settings:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching font settings:', error);
    return null;
  }
};

export const saveFontSettings = async (currentFont: string, titleFont: string, favoriteFonts: string[]): Promise<boolean> => {
  const userId = getUserId();
  
  try {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (!existingUser) {
      console.error('User does not exist in users table, cannot create font settings');
      return false;
    }
    
    // First check if settings exist
    const existingSettings = await getFontSettings();
    
    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('font_settings')
        .update({
          current_font: currentFont,
          title_font: titleFont,
          favorite_fonts: favoriteFonts,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating font settings:', error);
        return false;
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('font_settings')
        .insert({
          user_id: userId,
          current_font: currentFont,
          title_font: titleFont,
          favorite_fonts: favoriteFonts,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating font settings:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving font settings:', error);
    return false;
  }
};

export const updateCurrentFont = async (font: string): Promise<boolean> => {
  const userId = getUserId();
  
  try {
    const { error } = await supabase
      .from('font_settings')
      .update({
        current_font: font,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating current font:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating current font:', error);
    return false;
  }
};

export const updateTitleFont = async (titleFont: string): Promise<boolean> => {
  const userId = getUserId();
  
  try {
    const { error } = await supabase
      .from('font_settings')
      .update({
        title_font: titleFont,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating title font:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating title font:', error);
    return false;
  }
};

export const updateFavoriteFonts = async (favoriteFonts: string[]): Promise<boolean> => {
  const userId = getUserId();
  
  try {
    const { error } = await supabase
      .from('font_settings')
      .update({
        favorite_fonts: favoriteFonts,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating favorite fonts:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating favorite fonts:', error);
    return false;
  }
};
