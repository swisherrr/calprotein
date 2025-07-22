-- Add hidden_templates field to user_profiles table
-- This allows users to hide specific templates from other users regardless of privacy settings

-- Add hidden_templates column as JSONB array to store template IDs
ALTER TABLE user_profiles 
ADD COLUMN hidden_templates JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN user_profiles.hidden_templates IS 'Array of template IDs that should be hidden from other users. Works independently of templates_private setting.';

-- Add index for better performance when querying hidden templates
CREATE INDEX idx_user_profiles_hidden_templates ON user_profiles USING GIN (hidden_templates); 