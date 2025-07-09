-- Check which foreign key constraints already exist
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users' 
    AND ccu.table_schema = 'auth'
ORDER BY tc.table_name;

-- Also check all constraints on each table to see what exists
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
WHERE tc.table_schema = 'public' 
    AND tc.table_name IN ('entries', 'usuals', 'user_settings', 'check_ins', 'user_profiles', 'workout_templates', 'workout_logs')
ORDER BY tc.table_name, tc.constraint_type; 