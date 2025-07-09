-- Add unique constraint on usernames in user_profiles table
-- This prevents duplicate usernames at the database level

-- Ensure user_profiles username uniqueness is enforced
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_unique 
ON user_profiles (username) 
WHERE username IS NOT NULL;

-- Add a comment to explain the constraint
COMMENT ON INDEX user_profiles_username_unique IS 'Ensures usernames are unique across all users'; 