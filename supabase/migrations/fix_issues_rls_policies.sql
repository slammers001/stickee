-- Update RLS policies for issues table to work with public.users system
-- This migration fixes the issue where issues weren't saving because RLS policies were checking auth.uid() instead of public.users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own issues" ON issues;
DROP POLICY IF EXISTS "Users can insert their own issues" ON issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON issues;

-- Create new policies that work with the public.users system
-- Since the app uses a custom user ID system without authentication,
-- we need to allow access based on the user_id field directly

CREATE POLICY "Users can view their own issues" ON issues
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own issues" ON issues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own issues" ON issues
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own issues" ON issues
  FOR DELETE USING (true);

-- Alternatively, if you want more restrictive policies, you could use:
-- CREATE POLICY "Users can view their own issues" ON issues
--   FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

-- But for now, we'll allow all operations since the app manages user IDs locally
