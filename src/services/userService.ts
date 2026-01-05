import { supabase } from '@/lib/supabase';

// Get current app version from package.json (embedded during build)
const APP_VERSION = import.meta.env.VITE_APP_VERSION;

const USER_ID_KEY = 'stickee_user_id';

// Get user ID with fallback to localStorage
export const getUserId = async (): Promise<string> => {
  // Fallback to localStorage for backward compatibility
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    console.log('No user ID found, creating new one');
    // Generate a proper UUID instead of timestamp-based string
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  } else if (userId.startsWith('guest_')) {
    // Migrate old guest_ format IDs to proper UUIDs
    console.log('Migrating old guest ID to UUID:', userId);
    const newUserId = crypto.randomUUID();
    
    // Try to migrate the user in the database
    try {
      const { error } = await supabase
        .from('users')
        .update({ id: newUserId })
        .eq('id', userId);
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('Error migrating user ID:', error);
        // If migration fails, still use the new UUID for new operations
        // but keep the old one for reference
      }
      
      // Also try to migrate notes
      const { error: notesError } = await supabase
        .from('notes')
        .update({ user_id: newUserId })
        .eq('user_id', userId);
      
      if (notesError) {
        console.error('Error migrating notes user_id:', notesError);
      }
    } catch (error) {
      console.error('Error during user migration:', error);
    }
    
    // Update localStorage with new UUID
    localStorage.setItem(USER_ID_KEY, newUserId);
    userId = newUserId;
  }
  
  console.log('Using user ID from public.users system:', userId);
  return userId;
};

export const getCurrentUser = async () => {
  const userId = await getUserId();
  return {
    id: userId,
    isGuest: true,
    displayName: `User ${userId.substring(0, 8)}`
  };
};

// Create user in Supabase if they don't exist
// Save terms agreement to Supabase
export const saveTermsAgreement = async (): Promise<boolean> => {
  const userId = await getUserId();
  console.log('Saving terms agreement for user:', userId);
  
  try {
    // First, let's check what columns exist by trying a simple select
    const { data: userData, error: checkError } = await supabase
      .from('users')
      .select('id, terms_agreed, terms_agreed_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking user data:', checkError);
      return false;
    }
    
    console.log('Current user data:', userData);
    
    // Now try to update
    const { data, error } = await supabase
      .from('users')
      .update({
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_version: APP_VERSION
      })
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error('Error saving terms agreement:', error);
      console.error('Error details:', error.details, error.hint, error.code);
      return false;
    }
    
    console.log('Terms agreement saved successfully:', data);
    return true;
  } catch (error) {
    console.error('Error saving terms agreement:', error);
    return false;
  }
};

export const ensureUserExists = async (): Promise<boolean> => {
  const userId = await getUserId();
  console.log('Ensuring user exists for ID:', userId);
  
  try {
    // Check if Supabase is available first
    if (!supabase) {
      console.error('Supabase client not available');
      return false;
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking user existence:', checkError);
      // Check if it's a connection/auth error
      if (checkError.message?.includes('Invalid API key') || checkError.message?.includes('fetch')) {
        console.error('Supabase connection error - check if credentials are properly embedded');
      }
      return false;
    }
    
    console.log('Existing user:', existingUser);
    
    // If user doesn't exist, create them
    if (!existingUser) {
      console.log('Creating new user with ID:', userId);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          created_at: new Date().toISOString(),
          app_version: APP_VERSION
        });
      
      if (insertError) {
        console.error('Error creating user:', insertError);
        return false;
      }
      
      console.log('User created successfully');
    } else {
      console.log('User already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return false;
  }
};

// Update user's app version
export const updateUserVersion = async (): Promise<boolean> => {
  const userId = await getUserId();
  console.log('Updating app version for user:', userId, 'to version:', APP_VERSION);
  
  try {
    // Check if Supabase is available first
    if (!supabase) {
      console.error('Supabase client not available');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        app_version: APP_VERSION,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, app_version, updated_at');
    
    if (error) {
      console.error('Error updating user version:', error);
      // Check if it's a connection/auth error
      if (error.message?.includes('Invalid API key') || error.message?.includes('fetch')) {
        console.error('Supabase connection error - check if credentials are properly embedded');
      }
      return false;
    }
    
    console.log('User version updated successfully:', data);
    return true;
  } catch (error) {
    console.error('Error updating user version:', error);
    return false;
  }
};

// Get version statistics
export const getVersionStats = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('app_version')
      .not('app_version', 'is', null);
    
    if (error) {
      console.error('Error getting version stats:', error);
      return null;
    }
    
    // Count users per version
    const versionCounts = data?.reduce((acc: Record<string, number>, user) => {
      const version = user.app_version || 'unknown';
      acc[version] = (acc[version] || 0) + 1;
      return acc;
    }, {}) || {};
    
    return {
      totalUsers: data?.length || 0,
      versionCounts,
      currentVersion: APP_VERSION
    };
  } catch (error) {
    console.error('Error getting version stats:', error);
    return null;
  }
};