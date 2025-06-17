-- Create check_ins table
CREATE TABLE check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL,
    body_fat_percentage DECIMAL,
    chest_measurement DECIMAL,
    waist_measurement DECIMAL,
    hip_measurement DECIMAL,
    arm_measurement DECIMAL,
    thigh_measurement DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for check_ins
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-ins"
    ON check_ins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own check-ins"
    ON check_ins FOR INSERT
    WITH CHECK (auth.uid() = user_id); 