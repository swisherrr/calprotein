-- Safely fix user deletion constraints by dropping and recreating with CASCADE
-- This approach handles existing constraints gracefully

-- 1. Fix entries table
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entries_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE entries DROP CONSTRAINT entries_user_id_fkey;
    END IF;
    
    -- Add new constraint with CASCADE
    ALTER TABLE entries 
    ADD CONSTRAINT entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 2. Fix usuals table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'usuals_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE usuals DROP CONSTRAINT usuals_user_id_fkey;
    END IF;
    
    ALTER TABLE usuals 
    ADD CONSTRAINT usuals_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 3. Fix user_settings table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_settings_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_settings DROP CONSTRAINT user_settings_user_id_fkey;
    END IF;
    
    ALTER TABLE user_settings 
    ADD CONSTRAINT user_settings_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 4. Fix check_ins table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_ins_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE check_ins DROP CONSTRAINT check_ins_user_id_fkey;
    END IF;
    
    ALTER TABLE check_ins 
    ADD CONSTRAINT check_ins_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 5. Fix user_profiles table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
    END IF;
    
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 6. Fix workout_templates table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workout_templates_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE workout_templates DROP CONSTRAINT workout_templates_user_id_fkey;
    END IF;
    
    ALTER TABLE workout_templates 
    ADD CONSTRAINT workout_templates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 7. Fix workout_logs table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workout_logs_user_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE workout_logs DROP CONSTRAINT workout_logs_user_id_fkey;
    END IF;
    
    ALTER TABLE workout_logs 
    ADD CONSTRAINT workout_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- Verify all constraints are now properly set up
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