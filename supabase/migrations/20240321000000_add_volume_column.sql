-- Add total_volume column to workout_logs table
ALTER TABLE workout_logs
ADD COLUMN total_volume INTEGER NOT NULL DEFAULT 0;

-- Update existing records to calculate total volume from exercises
UPDATE workout_logs
SET total_volume = (
  SELECT COALESCE(SUM(
    (CAST(exercise->>'sets' AS INTEGER) * 
     CAST(exercise->>'reps' AS INTEGER) * 
     CAST(exercise->>'weight' AS INTEGER))
  ), 0)
  FROM jsonb_array_elements(exercises) AS exercise
); 