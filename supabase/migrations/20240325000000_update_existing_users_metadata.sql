-- Update existing users to have username in their metadata
-- This migration updates users who were created before the username feature was added

-- Create a function to update user metadata with username
CREATE OR REPLACE FUNCTION update_user_metadata_with_username()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users who have a profile with username but no username in metadata
    FOR user_record IN 
        SELECT 
            u.id as user_id,
            p.username
        FROM auth.users u
        JOIN user_profiles p ON u.id = p.user_id
        WHERE p.username IS NOT NULL 
        AND (u.raw_user_meta_data->>'username' IS NULL OR u.raw_user_meta_data->>'display_name' IS NULL)
    LOOP
        -- Update the user's metadata to include username and display_name
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'username', user_record.username,
                'display_name', user_record.username
            )
        WHERE id = user_record.user_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update existing users
SELECT update_user_metadata_with_username();

-- Drop the function after use
DROP FUNCTION update_user_metadata_with_username();

-- Create a trigger to automatically update metadata when user_profiles are updated
CREATE OR REPLACE FUNCTION sync_username_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's metadata when username is changed in user_profiles
    IF NEW.username IS DISTINCT FROM OLD.username THEN
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'username', NEW.username,
                'display_name', NEW.username
            )
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_profiles table
DROP TRIGGER IF EXISTS sync_username_metadata_trigger ON user_profiles;
CREATE TRIGGER sync_username_metadata_trigger
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_username_to_metadata(); 