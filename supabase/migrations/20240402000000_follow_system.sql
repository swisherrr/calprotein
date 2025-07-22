-- Drop old friends system tables
DROP TABLE IF EXISTS friendship_requests CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;

-- Create follows table
CREATE TABLE follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, followed_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their follows"
    ON follows FOR SELECT
    USING (auth.uid() = follower_id OR auth.uid() = followed_id);

CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update their own follow requests"
    ON follows FOR UPDATE
    USING (auth.uid() = followed_id)
    WITH CHECK (auth.uid() = followed_id);

CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING (auth.uid() = follower_id OR auth.uid() = followed_id);

CREATE OR REPLACE FUNCTION update_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_follows_updated_at
    BEFORE UPDATE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follows_updated_at(); 