-- Add missing UPDATE policy for workout_logs table
-- This allows users to edit their workout logs

CREATE POLICY "Users can update their own workout logs"
    ON workout_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comment to explain the policy
COMMENT ON POLICY "Users can update their own workout logs" ON workout_logs IS 'Allows users to edit their own workout logs';
