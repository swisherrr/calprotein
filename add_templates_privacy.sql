-- Add templates_private field to user_profiles table
-- This allows users to control who can see their workout templates

-- Add templates_private column with default value false (public)
ALTER TABLE user_profiles 
ADD COLUMN templates_private BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN user_profiles.templates_private IS 'When true, only friends can see workout templates. When false, templates are public.'; 