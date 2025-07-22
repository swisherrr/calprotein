-- Likes table for shared_workouts posts
CREATE TABLE post_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES shared_workouts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can like/unlike posts" ON post_likes FOR INSERT USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view post likes" ON post_likes FOR SELECT USING (true);

-- Comments table for shared_workouts posts
CREATE TABLE post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES shared_workouts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can comment on posts" ON post_comments FOR INSERT USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view post comments" ON post_comments FOR SELECT USING (true); 