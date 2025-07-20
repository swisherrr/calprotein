-- STEP 4: Create indexes and triggers
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