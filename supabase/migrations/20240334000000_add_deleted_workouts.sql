-- Add deleted_workouts field to user_profiles table
-- This allows users to hide workouts from everyone including themselves

-- Add deleted_workouts column as JSONB array to store workout IDs
ALTER TABLE user_profiles 
ADD COLUMN deleted_workouts JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN user_profiles.deleted_workouts IS 'Array of workout IDs that should be hidden from everyone including the owner.';

-- Add index for better performance when querying deleted workouts
CREATE INDEX idx_user_profiles_deleted_workouts ON user_profiles USING GIN (deleted_workouts); 