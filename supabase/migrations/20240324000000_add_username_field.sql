-- Add username field to user_profiles table with unique constraint
-- This migration adds a username field that will be used as the display name

-- Add username column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN username TEXT;

-- Add unique constraint to ensure no two users can have the same username
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);

-- Add check constraint to ensure username is not empty and follows basic rules
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_username_check 
CHECK (username IS NULL OR (length(username) >= 3 AND length(username) <= 30 AND username ~ '^[a-zA-Z0-9_-]+$'));

-- Add comment to explain the username field
COMMENT ON COLUMN user_profiles.username IS 'Unique username for the user, used as display name. Must be 3-30 characters, alphanumeric with underscores and hyphens only.';

-- Update RLS policies to include username
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Recreate policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add policy to allow checking username availability (for signup)
CREATE POLICY "Anyone can check username availability"
    ON user_profiles FOR SELECT
    USING (true); 