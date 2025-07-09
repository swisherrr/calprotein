-- Debug script to understand database structure and user deletion issue

-- 1. Check all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check if the tables mentioned in the code actually exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('entries', 'usuals', 'user_settings', 'check_ins', 'workout_templates', 'workout_logs')
ORDER BY table_name;

-- 3. Check the structure of tables that exist (if any)
-- Replace 'table_name' with actual table names from step 2
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'table_name'
-- ORDER BY ordinal_position;

-- 4. Check for any triggers on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 5. Check for any functions that might be called on user deletion
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%delete%';

-- 6. Check if there are any RLS policies that might interfere
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'; 