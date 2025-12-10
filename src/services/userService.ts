import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

const USER_ID_KEY = 'stickee_user_id';

export const getUserId = (): string => {
  // Try to get existing user ID from localStorage
  let userId = localStorage.getItem(USER_ID_KEY);
  
  // If no user ID exists, create a new one
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
};

export const getCurrentUser = () => {
  const userId = getUserId();
  return {
    id: userId,
    isGuest: true,
    displayName: `User ${userId.substring(0, 8)}` // Show first 8 chars of UUID
  };
};

// Create user in Supabase if they don't exist
export const ensureUserExists = async (): Promise<boolean> => {
  const userId = getUserId();
  console.log('Ensuring user exists for ID:', userId);
  
  try {
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking user existence:', checkError);
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
          created_at: new Date().toISOString()
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
