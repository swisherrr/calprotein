-- Add auto load reps and weight settings to user_settings table
-- This allows users to have their auto load preferences persist across devices

ALTER TABLE user_settings 
ADD COLUMN auto_load_reps BOOLEAN DEFAULT FALSE;

ALTER TABLE user_settings 
ADD COLUMN auto_load_weight BOOLEAN DEFAULT FALSE;

-- Add comments to explain the new fields
COMMENT ON COLUMN user_settings.auto_load_reps IS 'When true, entering reps in the first set will automatically fill the same number of reps for all remaining sets in that exercise.';
COMMENT ON COLUMN user_settings.auto_load_weight IS 'When true, entering weight in the first set will automatically fill the same weight for all remaining sets in that exercise.'; 