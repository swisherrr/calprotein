-- Add policy for friends search functionality
-- This allows authenticated users to search for other users by username

-- Drop the existing broad policy
DROP POLICY IF EXISTS "Anyone can check username availability" ON user_profiles;

-- Create a more specific policy for authenticated users to search
CREATE POLICY "Authenticated users can search for other users"
    ON user_profiles FOR SELECT
    USING (auth.role() = 'authenticated'); 