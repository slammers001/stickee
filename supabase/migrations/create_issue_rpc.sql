-- Create RPC function to bypass schema cache issues
CREATE OR REPLACE FUNCTION create_issue(
  p_title TEXT,
  p_description TEXT,
  p_type TEXT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type TEXT,
  user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the issue
  INSERT INTO issues (
    title, 
    description, 
    type, 
    user_id, 
    status, 
    created_at, 
    updated_at
  ) VALUES (
    p_title,
    p_description,
    p_type,
    p_user_id,
    'open',
    NOW(),
    NOW()
  )
  RETURNING *;
END;
$$;
