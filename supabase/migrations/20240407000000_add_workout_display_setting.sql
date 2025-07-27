-- Add workout display setting to user_settings table
-- This allows users to choose how previous workout data is displayed (average vs individual sets)

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS display_workout_average BOOLEAN DEFAULT TRUE;

-- Add comment to explain the new field
COMMENT ON COLUMN user_settings.display_workout_average IS 'When true, displays average reps/weight from previous workout. When false, displays individual set data.'; 