-- Create body_measurements table for storing user body measurements
-- This allows users to track their body measurements over time

CREATE TABLE body_measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    measurement_date DATE NOT NULL,
    weight_lbs DECIMAL(5,2),
    bicep_circumference_inches DECIMAL(4,2),
    chest_circumference_inches DECIMAL(4,2),
    waist_circumference_inches DECIMAL(4,2),
    hip_circumference_inches DECIMAL(4,2),
    thigh_circumference_inches DECIMAL(4,2),
    calf_circumference_inches DECIMAL(4,2),
    body_fat_percentage DECIMAL(4,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comment to explain the table
COMMENT ON TABLE body_measurements IS 'User body measurements tracked over time for progress monitoring';

-- Add comments to explain the measurement fields
COMMENT ON COLUMN body_measurements.weight_lbs IS 'Body weight in pounds';
COMMENT ON COLUMN body_measurements.bicep_circumference_inches IS 'Bicep circumference in inches';
COMMENT ON COLUMN body_measurements.chest_circumference_inches IS 'Chest circumference in inches';
COMMENT ON COLUMN body_measurements.waist_circumference_inches IS 'Waist circumference in inches';
COMMENT ON COLUMN body_measurements.hip_circumference_inches IS 'Hip circumference in inches';
COMMENT ON COLUMN body_measurements.thigh_circumference_inches IS 'Thigh circumference in inches';
COMMENT ON COLUMN body_measurements.calf_circumference_inches IS 'Calf circumference in inches';
COMMENT ON COLUMN body_measurements.body_fat_percentage IS 'Body fat percentage';

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for body_measurements
CREATE POLICY "Users can view their own body measurements"
    ON body_measurements FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body measurements"
    ON body_measurements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body measurements"
    ON body_measurements FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body measurements"
    ON body_measurements FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX idx_body_measurements_date ON body_measurements(measurement_date DESC);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, measurement_date DESC);

-- Create a unique constraint to prevent multiple measurements on the same date for the same user
CREATE UNIQUE INDEX idx_body_measurements_user_date_unique ON body_measurements(user_id, measurement_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_body_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_body_measurements_updated_at
    BEFORE UPDATE ON body_measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_body_measurements_updated_at();
