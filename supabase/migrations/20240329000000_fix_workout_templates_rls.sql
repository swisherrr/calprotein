-- Fix RLS policies on workout_templates to allow viewing based on privacy settings
-- This migration updates the policies to allow friends and public access to templates

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can insert their own workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can update their own workout templates" ON workout_templates;
DROP POLICY IF EXISTS "Users can delete their own workout templates" ON workout_templates;

-- Create new policies that allow viewing based on privacy settings

-- Policy for viewing templates: users can view their own templates, or public templates, or templates from friends
CREATE POLICY "Users can view templates based on privacy"
    ON workout_templates FOR SELECT
    USING (
        -- Users can always view their own templates
        auth.uid() = user_id
        OR
        -- Users can view public templates (when templates_private is false)
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = workout_templates.user_id 
            AND user_profiles.templates_private = false
        )
        OR
        -- Users can view templates from friends (when templates_private is true but they are friends)
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN friendships f ON (
                (f.user1_id = auth.uid() AND f.user2_id = up.user_id) OR
                (f.user1_id = up.user_id AND f.user2_id = auth.uid())
            )
            WHERE up.user_id = workout_templates.user_id 
            AND up.templates_private = true
        )
    );

-- Policy for inserting templates: users can only insert their own templates
CREATE POLICY "Users can insert their own workout templates"
    ON workout_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for updating templates: users can only update their own templates
CREATE POLICY "Users can update their own workout templates"
    ON workout_templates FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for deleting templates: users can only delete their own templates
CREATE POLICY "Users can delete their own workout templates"
    ON workout_templates FOR DELETE
    USING (auth.uid() = user_id); 