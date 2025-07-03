-- Add volume tracking to exercises in workout_logs
-- This migration adds a comment to document the expected structure of the exercises JSONB field

COMMENT ON COLUMN workout_logs.exercises IS 'JSONB array of exercises with structure: [
  {
    "name": "Exercise Name",
    "sets": 3,
    "reps": 10,
    "weight": 100,
    "volume": 3000,
    "notes": "Optional notes"
  }
] where volume = sets × reps × weight';

-- Add a function to calculate exercise volume
CREATE OR REPLACE FUNCTION calculate_exercise_volume(
    sets INTEGER,
    reps INTEGER,
    weight INTEGER
) RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(sets, 0) * COALESCE(reps, 0) * COALESCE(weight, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a function to update exercise volumes in existing workouts
CREATE OR REPLACE FUNCTION update_exercise_volumes()
RETURNS void AS $$
DECLARE
    workout_record RECORD;
    exercise JSONB;
    updated_exercises JSONB;
    i INTEGER;
BEGIN
    FOR workout_record IN SELECT id, exercises FROM workout_logs WHERE exercises IS NOT NULL
    LOOP
        updated_exercises := '[]'::JSONB;
        
        FOR i IN 0..jsonb_array_length(workout_record.exercises) - 1
        LOOP
            exercise := workout_record.exercises->i;
            
            -- Calculate volume if not already present
            IF exercise->>'volume' IS NULL THEN
                exercise := jsonb_set(
                    exercise,
                    '{volume}',
                    to_jsonb(calculate_exercise_volume(
                        (exercise->>'sets')::INTEGER,
                        (exercise->>'reps')::INTEGER,
                        (exercise->>'weight')::INTEGER
                    ))
                );
            END IF;
            
            updated_exercises := updated_exercises || exercise;
        END LOOP;
        
        -- Update the workout with calculated volumes
        UPDATE workout_logs 
        SET exercises = updated_exercises 
        WHERE id = workout_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the update function to add volumes to existing workouts
SELECT update_exercise_volumes();

-- Drop the temporary function
DROP FUNCTION update_exercise_volumes(); 