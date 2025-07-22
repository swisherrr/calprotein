-- Add fields for hiding and deleting progress pictures
ALTER TABLE user_profiles 
ADD COLUMN hidden_progress_pictures UUID[] DEFAULT '{}',
ADD COLUMN deleted_progress_pictures UUID[] DEFAULT '{}';

-- Add comments
COMMENT ON COLUMN user_profiles.hidden_progress_pictures IS 'Array of progress picture IDs that are hidden from public view';
COMMENT ON COLUMN user_profiles.deleted_progress_pictures IS 'Array of progress picture IDs that are marked as deleted';

-- Update RLS policies to respect hidden progress pictures
DROP POLICY IF EXISTS "Users can view progress pictures based on privacy" ON progress_pictures;

CREATE POLICY "Users can view progress pictures based on privacy"
    ON progress_pictures FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        (
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.user_id = progress_pictures.user_id
                AND user_profiles.private_account = false
            )
            OR
            EXISTS (
                SELECT 1 FROM follows
                WHERE follows.follower_id = auth.uid()
                  AND follows.followed_id = progress_pictures.user_id
                  AND follows.status = 'accepted'
            )
        )
        AND
        NOT EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = progress_pictures.user_id
            AND progress_pictures.id = ANY(user_profiles.hidden_progress_pictures)
        )
        AND
        NOT EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = progress_pictures.user_id
            AND progress_pictures.id = ANY(user_profiles.deleted_progress_pictures)
        )
    ); 