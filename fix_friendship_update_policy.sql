-- Fix RLS policy to allow senders to update their own requests
-- This allows users to resend rejected requests

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update requests they received" ON friendship_requests;

-- Create a new policy that allows both sender and receiver to update requests
CREATE POLICY "Users can update requests they sent or received"
    ON friendship_requests FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id); 