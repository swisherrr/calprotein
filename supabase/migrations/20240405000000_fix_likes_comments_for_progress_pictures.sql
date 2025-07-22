-- Drop existing tables and recreate them to support both workout and progress picture posts
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_likes;

-- Create a posts table to unify workout and progress picture posts
CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    post_type TEXT NOT NULL CHECK (post_type IN ('workout', 'progress')),
    workout_id UUID REFERENCES shared_workouts(id) ON DELETE CASCADE,
    progress_picture_id UUID REFERENCES progress_pictures(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT one_post_type CHECK (
        (post_type = 'workout' AND workout_id IS NOT NULL AND progress_picture_id IS NULL) OR
        (post_type = 'progress' AND progress_picture_id IS NOT NULL AND workout_id IS NULL)
    )
);

-- Likes table for all posts
CREATE TABLE post_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

-- Comments table for all posts
CREATE TABLE post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Users can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can like/unlike posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view post likes" ON post_likes FOR SELECT USING (true);

-- Comments policies
CREATE POLICY "Users can comment on posts" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view post comments" ON post_comments FOR SELECT USING (true);

-- Insert existing shared_workouts as posts
INSERT INTO posts (user_id, post_type, workout_id, created_at)
SELECT user_id, 'workout', id, created_at FROM shared_workouts;

-- Insert existing progress_pictures as posts
INSERT INTO posts (user_id, post_type, progress_picture_id, created_at)
SELECT user_id, 'progress', id, created_at FROM progress_pictures; 