import { createClient } from '@supabase/supabase-js';

// Get environment variables - fallback to hardcoded values for Electron builds
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron ? 
    'https://your-project.supabase.co' : '');

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron ? 
    'your-anon-key' : '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables or build configuration.');
  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    console.error('Electron build detected - Supabase credentials not properly embedded during build');
  }
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

export const signInWithEmail = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  
  if (error) handleSupabaseError(error, 'signInWithEmail');
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
