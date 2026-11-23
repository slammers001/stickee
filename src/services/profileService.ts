import { supabase } from '@/lib/supabase';

const PROFILE_KEY = 'stickee_profile';

export interface UserProfile {
  name: string;
  email: string;
  avatarColor: string;
}

export interface AvatarTheme {
  background: string;
  letter: string;
}

// Avatars are fixed: a random pick between these two combos, assigned once and
// never editable by the user.
export const AVATAR_THEMES: AvatarTheme[] = [
  { background: '#fff1bf', letter: '#735c40' },
  { background: '#735c40', letter: '#ffc2cc' },
];

export const getAvatarTheme = (avatarColor: string | null | undefined): AvatarTheme =>
  AVATAR_THEMES.find((theme) => theme.background === avatarColor) ?? AVATAR_THEMES[0];

export const getAvatarLetterColor = (avatarColor: string | null | undefined): string =>
  getAvatarTheme(avatarColor).letter;

export const pickRandomAvatarColor = (): string =>
  AVATAR_THEMES[Math.floor(Math.random() * AVATAR_THEMES.length)].background;

const getStorageKey = (userId: string) => `${PROFILE_KEY}_${userId}`;

const saveLocal = (userId: string, profile: UserProfile) => {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(profile));
};

const getLocal = (userId: string): UserProfile | null => {
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
};

// The avatar lives in Supabase so it follows the account. It is assigned once,
// on the first load that finds no stored color.
const loadAvatarColor = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('avatar_color')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data?.avatar_color && getAvatarTheme(data.avatar_color).background === data.avatar_color) {
      return data.avatar_color;
    }

    const color = pickRandomAvatarColor();
    await supabase
      .from('users')
      .update({ avatar_color: color, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return color;
  } catch {
    const local = getLocal(userId);
    return local?.avatarColor ? getAvatarTheme(local.avatarColor).background : pickRandomAvatarColor();
  }
};

export const getProfile = async (userId: string): Promise<UserProfile> => {
  const local = getLocal(userId);
  const avatarColor = await loadAvatarColor(userId);

  const profile: UserProfile = {
    name: local?.name ?? '',
    email: local?.email ?? '',
    avatarColor,
  };
  saveLocal(userId, profile);
  return profile;
};

// Saves only the editable parts of the profile. The avatar color is never written
// here so it can't be changed by the user.
export const saveProfile = async (userId: string, profile: UserProfile): Promise<boolean> => {
  try {
    const name = profile.name.trim();
    const toStore: UserProfile = { ...profile, name };
    saveLocal(userId, toStore);

    if (name) {
      try {
        await supabase.auth.updateUser({ data: { name, full_name: name } });
      } catch (error) {
        console.error('Error updating auth display name:', error);
      }
    }

    try {
      await supabase
        .from('users')
        .update({ display_name: name, updated_at: new Date().toISOString() })
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