-- Add total_volume column to workout_logs table
ALTER TABLE workout_logs 
ADD COLUMN total_volume INTEGER DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN workout_logs.total_volume IS 'Total volume lifted in pounds (sets × reps × weight)'; 