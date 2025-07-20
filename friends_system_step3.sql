-- STEP 3: Enable RLS and create policies
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