-- Update RLS policy on workout_templates to use private_account instead of templates_private

DROP POLICY IF EXISTS "Users can view templates based on privacy" ON workout_templates;

CREATE POLICY "Users can view templates based on privacy"
    ON workout_templates FOR SELECT
    USING (
        -- Users can always view their own templates
        auth.uid() = user_id
        OR
        -- Users can view public templates (when private_account is false)
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = workout_templates.user_id 
            AND user_profiles.private_account = false
        )
        OR
        -- Users can view templates from friends (when private_account is true but they are friends)
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN friendships f ON (
                (f.user1_id = auth.uid() AND f.user2_id = up.user_id) OR
                (f.user1_id = up.user_id AND f.user2_id = auth.uid())
            )
            WHERE up.user_id = workout_templates.user_id 
            AND up.private_account = true
        )
    ); 