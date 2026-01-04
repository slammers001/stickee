-- Fix the issues table foreign key to reference public.users instead of auth.users
-- This allows the app to use the existing public.users system without requiring authentication

-- First, drop the existing foreign key constraint
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_user_id_fkey;

-- Then add the new foreign key constraint pointing to public.users
ALTER TABLE public.issues 
ADD CONSTRAINT issues_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verify the constraint was added correctly
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'issues';
