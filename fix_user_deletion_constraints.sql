-- Fix user deletion by adding ON DELETE CASCADE to all foreign key constraints
-- This will allow users to be deleted and automatically clean up related data

-- Add foreign key constraints with CASCADE delete to all tables that reference users

-- 1. Add constraint to entries table
ALTER TABLE entries 
ADD CONSTRAINT entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add constraint to usuals table
ALTER TABLE usuals 
ADD CONSTRAINT usuals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add constraint to user_settings table
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Add constraint to check_ins table
ALTER TABLE check_ins 
ADD CONSTRAINT check_ins_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Add constraint to user_profiles table
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. workout_templates and workout_logs should already have CASCADE from the migration
-- But let's make sure they're properly set up
ALTER TABLE workout_templates 
ADD CONSTRAINT workout_templates_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE workout_logs 
ADD CONSTRAINT workout_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraints were added
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