-- Create user_custom_exercises table for storing user-specific custom exercises
-- This allows users to add their own exercises while maintaining exact name matching for volume tracking

CREATE TABLE user_custom_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, exercise_name)
);

-- Add comment to explain the table
COMMENT ON TABLE user_custom_exercises IS 'User-specific custom exercises that are combined with the hardcoded exercise list';

-- Enable RLS
ALTER TABLE user_custom_exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_custom_exercises
CREATE POLICY "Users can view their own custom exercises"
    ON user_custom_exercises FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom exercises"
    ON user_custom_exercises FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom exercises"
    ON user_custom_exercises FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom exercises"
    ON user_custom_exercises FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_custom_exercises_user_id ON user_custom_exercises(user_id);
CREATE INDEX idx_user_custom_exercises_muscle_group ON user_custom_exercises(muscle_group); 