-- Add profile_picture_url field to user_profiles table
-- This migration adds a field to store the URL of the user's profile picture

-- Add profile_picture_url column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN profile_picture_url TEXT;

-- Add comment to explain the profile_picture_url field
COMMENT ON COLUMN user_profiles.profile_picture_url IS 'URL to the user profile picture stored in Supabase Storage';

-- Update RLS policies to include profile_picture_url
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