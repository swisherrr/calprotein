-- Add hidden_workouts field to user_profiles table
-- This allows users to hide specific workouts from other users

-- Add hidden_workouts column as JSONB array to store workout IDs
ALTER TABLE user_profiles 
ADD COLUMN hidden_workouts JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN user_profiles.hidden_workouts IS 'Array of workout IDs that should be hidden from other users. Works independently of other privacy settings.';

-- Add index for better performance when querying hidden workouts
CREATE INDEX idx_user_profiles_hidden_workouts ON user_profiles USING GIN (hidden_workouts); 