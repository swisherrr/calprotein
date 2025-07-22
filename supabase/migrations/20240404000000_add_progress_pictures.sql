-- Add progress pictures table for users to share progress photos
CREATE TABLE progress_pictures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE progress_pictures ENABLE ROW LEVEL SECURITY;

-- RLS policies for progress pictures
CREATE POLICY "Users can view progress pictures based on privacy"
    ON progress_pictures FOR SELECT
    USING (
        auth.uid() = user_id
        OR
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
    );

CREATE POLICY "Users can insert their own progress pictures"
    ON progress_pictures FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress pictures"
    ON progress_pictures FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress pictures"
    ON progress_pictures FOR DELETE
    USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_progress_pictures_user_id ON progress_pictures(user_id);
CREATE INDEX idx_progress_pictures_created_at ON progress_pictures(created_at DESC);

COMMENT ON TABLE progress_pictures IS 'Progress pictures shared by users';
COMMENT ON COLUMN progress_pictures.image_url IS 'URL to the uploaded progress picture';
COMMENT ON COLUMN progress_pictures.caption IS 'Optional caption for the progress picture'; 