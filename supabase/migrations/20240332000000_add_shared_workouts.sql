-- Create shared_workouts table for workouts posted to user profiles
-- This allows users to share their completed workouts on their public profile

CREATE TABLE shared_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    template_name TEXT,
    total_volume INTEGER NOT NULL,
    duration TEXT NOT NULL,
    exercises JSONB NOT NULL,
    exercise_stats JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment to explain the table
COMMENT ON TABLE shared_workouts IS 'Workouts that users choose to share on their public profile';

-- Enable RLS
ALTER TABLE shared_workouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shared_workouts
-- Users can view all shared workouts (they are public)
CREATE POLICY "Anyone can view shared workouts"
    ON shared_workouts FOR SELECT
    USING (true);

-- Users can only insert their own shared workouts
CREATE POLICY "Users can insert their own shared workouts"
    ON shared_workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own shared workouts
CREATE POLICY "Users can update their own shared workouts"
    ON shared_workouts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own shared workouts
CREATE POLICY "Users can delete their own shared workouts"
    ON shared_workouts FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for better performance when querying by user
CREATE INDEX idx_shared_workouts_user_id ON shared_workouts(user_id);

-- Create index for better performance when querying by creation date
CREATE INDEX idx_shared_workouts_created_at ON shared_workouts(created_at DESC); 