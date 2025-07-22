-- Add private_account field to user_profiles table
-- This allows users to make their entire account private (only friends can see templates and logged workouts)

ALTER TABLE user_profiles 
ADD COLUMN private_account BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN user_profiles.private_account IS 'When true, only friends can see this user\'s templates and logged workouts. When false, templates and workouts are public unless individually hidden.'; 