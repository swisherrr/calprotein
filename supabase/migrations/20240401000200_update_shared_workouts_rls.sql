-- Update RLS policy on shared_workouts to use private_account for privacy

DROP POLICY IF EXISTS "Anyone can view shared workouts" ON shared_workouts;

CREATE POLICY "Users can view shared workouts based on privacy"
    ON shared_workouts FOR SELECT
    USING (
        -- Users can always view their own shared workouts
        auth.uid() = user_id
        OR
        -- Users can view public shared workouts (when private_account is false)
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = shared_workouts.user_id 
            AND user_profiles.private_account = false
        )
        OR
        -- Users can view shared workouts from friends (when private_account is true but they are friends)
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN friendships f ON (
                (f.user1_id = auth.uid() AND f.user2_id = up.user_id) OR
                (f.user1_id = up.user_id AND f.user2_id = auth.uid())
            )
            WHERE up.user_id = shared_workouts.user_id 
            AND up.private_account = true
        )
    ); 