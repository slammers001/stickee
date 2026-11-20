import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-application-name': 'Stickee' },
  },
});

// Helper function to handle errors consistently
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error in ${context}:`, error);
  throw error;
};

export const GUEST_EMAIL_DOMAIN = 'guest.stickee.local';
export const GUEST_EMAIL_DISPLAY = 'YOU HAVE A GUEST ACCOUNT';

export const isGuestUser = (user: { email?: string | null; user_metadata?: Record<string, any> } | null | undefined) =>
  !!user && (user.user_metadata?.is_guest === true || (user.email ?? '').endsWith(`@${GUEST_EMAIL_DOMAIN}`));

export const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: fullName
      ? { data: { name: fullName, full_name: fullName } }
      : undefined,
  });
  
  if (error) handleSupabaseError(error, 'signUpWithEmail');
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) handleSupabaseError(error, 'signInWithEmail');
  return data;
};

export const signUpAsGuest = async (name: string, password: string) => {
  const trimmedName = name.trim();
  const guestEmail = `guest-${crypto.randomUUID()}@${GUEST_EMAIL_DOMAIN}`;

  const { data, error } = await supabase.auth.signUp({
    email: guestEmail,
    password,
    options: {
      data: {
        name: trimmedName,
        full_name: trimmedName,
        is_guest: true,
      },
    },
  });

  if (error) handleSupabaseError(error, 'signUpAsGuest');

  // Some Supabase setups require email confirmation and won't create a session
  // on sign-up. Try to sign in immediately so guest access is seamless.
  if (!data.session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: guestEmail,
      password,
    });
    if (signInError) handleSupabaseError(signInError, 'signUpAsGuest:signIn');
    return signInData;
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) handleSupabaseError(error, 'signOut');
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
};
