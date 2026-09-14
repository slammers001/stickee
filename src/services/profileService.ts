import { supabase } from '@/lib/supabase';

const PROFILE_KEY = 'stickee_profile';

export interface UserProfile {
  name: string;
  email: string;
  avatarColor: string;
  avatarImage: string | null;
}

const DEFAULT_COLORS = ['#fff1bf', '#735c40', '#FFC2CC'];

const getRandomDefaultColor = (): string => {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
};

const getStorageKey = (userId: string) => `${PROFILE_KEY}_${userId}`;

// Get profile from localStorage
export const getProfile = async (userId: string): Promise<UserProfile> => {
  const stored = localStorage.getItem(getStorageKey(userId));
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Return default profile
  const defaultProfile: UserProfile = {
    name: '',
    email: '',
    avatarColor: getRandomDefaultColor(),
    avatarImage: null,
  };
  
  localStorage.setItem(getStorageKey(userId), JSON.stringify(defaultProfile));
  return defaultProfile;
};

// Save profile to localStorage
export const saveProfile = async (userId: string, profile: UserProfile): Promise<boolean> => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(profile));
    
    // Also try to save to Supabase if columns exist
    try {
      await supabase
        .from('users')
        .update({
          display_name: profile.name,
          avatar_color: profile.avatarColor,
          avatar_image: profile.avatarImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch {
      // Column might not exist, that's fine
    }
    
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    return false;
  }
};

// Get initials from name
export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
