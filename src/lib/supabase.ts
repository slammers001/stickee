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

const normalizeGuestName = (name: string) => name.trim().toLowerCase();

const hashGuestName = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
};

export const getGuestEmailForName = (name: string) => {
  const normalized = normalizeGuestName(name);
  if (!normalized) {
    throw new Error('Please enter a guest name.');
  }
  const slug = normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `guest-${slug || 'u'}-${hashGuestName(normalized)}@${GUEST_EMAIL_DOMAIN}`;
};

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
  const guestEmail = getGuestEmailForName(trimmedName);

  // Try signing in to an existing guest account first so notes/data are restored.
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password,
  });

  if (!signInError && signInData?.session) {
    return signInData;
  }

  const signInMsg = (signInError?.message || '').toLowerCase();
  const invalidCreds = signInMsg.includes('invalid login credentials') || signInMsg.includes('invalid credentials');
  if (signInError && !invalidCreds) {
    handleSupabaseError(signInError, 'signUpAsGuest:signIn');
  }

  // No existing session with these credentials: try to create the guest account.
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

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('user already') ||
      msg.includes('duplicate')
    ) {
      throw new Error(
        'That guest name is already taken. If this is your account, check your password; otherwise choose a different name (e.g. add a number).'
      );
    }
    handleSupabaseError(error, 'signUpAsGuest');
  }

  // Some Supabase setups require email confirmation and won't create a session
  // on sign-up. Try to sign in immediately so guest access is seamless.
  if (!data.session) {
    const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
      email: guestEmail,
      password,
    });
    if (retrySignInError) handleSupabaseError(retrySignInError, 'signUpAsGuest:signIn');
    return retrySignInData;
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
