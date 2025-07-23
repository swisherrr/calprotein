-- Fix RLS policy on user_custom_exercises to allow reading other users' custom exercises for template copying
-- This is needed so users can copy templates with custom exercises and preserve the muscle group information

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own custom exercises" ON user_custom_exercises;

-- Create a new policy that allows reading custom exercises for template copying
CREATE POLICY "Users can view custom exercises for template copying"
    ON user_custom_exercises FOR SELECT
    USING (
        -- Users can always view their own custom exercises
        auth.uid() = user_id
        OR
        -- Users can view other users' custom exercises (needed for template copying)
        -- This allows the template copying functionality to work properly
        true
    );

-- Add comment to explain the policy
COMMENT ON POLICY "Users can view custom exercises for template copying" ON user_custom_exercises IS 'Allows users to read custom exercises from other users for template copying functionality'; 