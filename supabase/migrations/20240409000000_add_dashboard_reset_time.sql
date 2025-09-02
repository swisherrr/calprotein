-- Add dashboard reset time setting to user_settings table
-- This allows users to customize when their daily trackers reset (useful for night workers)

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS dashboard_reset_hour INTEGER DEFAULT 0;

-- Add comment to explain the new field
COMMENT ON COLUMN user_settings.dashboard_reset_hour IS 'Hour of day (0-23) when dashboard resets to new day. Default 0 (midnight).';
