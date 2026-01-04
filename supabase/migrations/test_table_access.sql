-- Test basic table access
SELECT * FROM issues LIMIT 1;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'issues' 
AND table_schema = 'public';

-- Check RLS status (using correct column name)
SELECT rowsecurity 
FROM pg_tables 
WHERE tablename = 'issues';
