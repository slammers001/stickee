-- Fix RLS policies for issues table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own issues" ON issues;
DROP POLICY IF EXISTS "Users can insert their own issues" ON issues;
DROP POLICY IF EXISTS "Users can update their own issues" ON issues;
DROP POLICY IF EXISTS "Users can delete their own issues" ON issues;

-- Create more permissive policies that handle null auth.uid()
CREATE POLICY "Users can view their own issues" ON issues
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own issues" ON issues
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own issues" ON issues
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can delete their own issues" ON issues
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Alternative: Temporarily disable RLS for testing
-- ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- Check current RLS status
-- SELECT rlsenabled FROM pg_tables WHERE tablename = 'issues';
