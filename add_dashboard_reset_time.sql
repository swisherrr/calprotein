-- Add dashboard reset time setting to user_settings table
-- This allows users to customize when their daily trackers reset (useful for night workers)

-- Run this in your Supabase SQL Editor

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS dashboard_reset_hour INTEGER DEFAULT 0;

-- Add comment to explain the new field
COMMENT ON COLUMN user_settings.dashboard_reset_hour IS 'Hour of day (0-23) when dashboard resets to new day. Default 0 (midnight).';

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
AND column_name = 'dashboard_reset_hour';
