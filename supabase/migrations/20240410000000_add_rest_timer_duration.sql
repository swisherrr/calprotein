-- Add rest_timer_duration setting to user_settings table
-- This allows users to customize how long their rest timer runs when they click the workout timer

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS rest_timer_duration INTEGER DEFAULT 120;

-- Add comment to explain the new field
COMMENT ON COLUMN user_settings.rest_timer_duration IS 'Duration in seconds for the rest timer. When the user clicks the workout timer, it will stay red for this duration. Default is 120 seconds (2 minutes).';

