-- Create friends system tables
-- This migration creates tables for managing friendships between users

-- Create friendship_requests table
CREATE TABLE friendship_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sender_id, receiver_id)
);

-- Create friendships table (for accepted friendships)
CREATE TABLE friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Enable RLS on both tables
ALTER TABLE friendship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS policies for friendship_requests
CREATE POLICY "Users can view requests they sent or received"
    ON friendship_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert friendship requests"
    ON friendship_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received"
    ON friendship_requests FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own requests"
    ON friendship_requests FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS policies for friendships
CREATE POLICY "Users can view their friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create indexes for better performance
CREATE INDEX idx_friendship_requests_sender ON friendship_requests(sender_id);
CREATE INDEX idx_friendship_requests_receiver ON friendship_requests(receiver_id);
CREATE INDEX idx_friendship_requests_status ON friendship_requests(status);
CREATE INDEX idx_friendships_user1 ON friendships(user1_id);
CREATE INDEX idx_friendships_user2 ON friendships(user2_id);

-- Create function to update updated_at timestamp for friendship_requests
CREATE OR REPLACE FUNCTION update_friendship_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for friendship_requests
CREATE TRIGGER update_friendship_requests_updated_at
    BEFORE UPDATE ON friendship_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_friendship_requests_updated_at();

-- Add comments
COMMENT ON TABLE friendship_requests IS 'Stores friendship requests between users';
COMMENT ON TABLE friendships IS 'Stores accepted friendships between users';
COMMENT ON COLUMN friendship_requests.status IS 'Status of the friendship request: pending, accepted, or rejected';
COMMENT ON COLUMN friendships.user1_id IS 'First user in the friendship (always the smaller UUID for consistency)';
COMMENT ON COLUMN friendships.user2_id IS 'Second user in the friendship (always the larger UUID for consistency)'; 