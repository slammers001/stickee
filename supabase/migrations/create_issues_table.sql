-- Create issues table for tracking bug reports, feature requests, etc.
CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'enhancement', 'question', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);

-- Set up RLS (Row Level Security)
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own issues (using public.users)
CREATE POLICY "Users can view their own issues" ON issues
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));

-- Create policy for users to insert their own issues (using public.users)
CREATE POLICY "Users can insert their own issues" ON issues
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE id = user_id));

-- Create policy for users to update their own issues (using public.users)
CREATE POLICY "Users can update their own issues" ON issues
  FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));

-- Create policy for users to delete their own issues (using public.users)
CREATE POLICY "Users can delete their own issues" ON issues
  FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
