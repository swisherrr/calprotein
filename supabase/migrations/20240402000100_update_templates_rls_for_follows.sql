-- Update RLS policy on workout_templates to use follows for privacy
DROP POLICY IF EXISTS "Users can view templates based on privacy" ON workout_templates;

CREATE POLICY "Users can view templates based on privacy"
    ON workout_templates FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = workout_templates.user_id 
            AND user_profiles.private_account = false
        )
        OR
        EXISTS (
            SELECT 1 FROM follows
            WHERE follows.follower_id = auth.uid()
              AND follows.followed_id = workout_templates.user_id
              AND follows.status = 'accepted'
        )
    ); 