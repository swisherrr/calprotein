-- Fix user deletion cascade constraints
-- This migration adds ON DELETE CASCADE to all foreign key constraints referencing auth.users(id)

-- Drop existing foreign key constraints and recreate them with CASCADE
-- Note: You'll need to run these commands in your Supabase SQL editor if these tables exist

-- For entries table (if it exists)
-- ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_user_id_fkey;
-- ALTER TABLE entries ADD CONSTRAINT entries_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For usuals table (if it exists)
-- ALTER TABLE usuals DROP CONSTRAINT IF EXISTS usuals_user_id_fkey;
-- ALTER TABLE usuals ADD CONSTRAINT usuals_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For user_settings table (if it exists)
-- ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
-- ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For check_ins table (if it exists)
-- ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_user_id_fkey;
-- ALTER TABLE check_ins ADD CONSTRAINT check_ins_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alternative approach: Create a function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete related data from all tables
    DELETE FROM workout_logs WHERE user_id = OLD.id;
    DELETE FROM workout_templates WHERE user_id = OLD.id;
    
    -- Add these if the tables exist:
    -- DELETE FROM entries WHERE user_id = OLD.id;
    -- DELETE FROM usuals WHERE user_id = OLD.id;
    -- DELETE FROM user_settings WHERE user_id = OLD.id;
    -- DELETE FROM check_ins WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS before_user_delete ON auth.users;
CREATE TRIGGER before_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_deletion(); 