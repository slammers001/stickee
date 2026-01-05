-- Add archive functionality to notes table
-- This migration adds archived status and timestamp columns

-- Add archived column to track if a note is archived
ALTER TABLE notes ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add archived_at column to track when a note was archived
ALTER TABLE notes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on archived notes
CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(archived);
CREATE INDEX IF NOT EXISTS idx_notes_archived_at ON notes(archived_at);

-- Update RLS policies to handle archived notes
-- Allow users to archive their own notes
CREATE POLICY "Users can archive their own notes" ON notes
  FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));

-- Allow users to view their own archived notes
CREATE POLICY "Users can view their own archived notes" ON notes
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));
