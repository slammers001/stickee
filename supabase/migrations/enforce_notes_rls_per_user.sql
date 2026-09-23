-- Enforce per-user note isolation using Supabase Auth
-- The app now gates access behind real accounts (auth-gate). Notes must be
-- visible/editable only by the authenticated user who owns them.

-- Drop any existing permissive policies on the notes table
DROP POLICY IF EXISTS "Users can archive their own notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own archived notes" ON notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Ensure RLS is enabled
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notes
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can only create notes assigned to themselves
CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only update their own notes
CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only delete their own notes
CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid()::text = user_id::text);
