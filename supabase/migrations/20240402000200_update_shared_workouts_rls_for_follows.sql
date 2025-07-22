-- Update RLS policy on shared_workouts to use follows for privacy
DROP POLICY IF EXISTS "Users can view shared workouts based on privacy" ON shared_workouts;

CREATE POLICY "Users can view shared workouts based on privacy"
    ON shared_workouts FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = shared_workouts.user_id 
            AND user_profiles.private_account = false
        )
        OR
        EXISTS (
            SELECT 1 FROM follows
            WHERE follows.follower_id = auth.uid()
              AND follows.followed_id = shared_workouts.user_id
              AND follows.status = 'accepted'
        )
    ); 