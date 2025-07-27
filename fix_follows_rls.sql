-- Fix RLS policy on follows table to allow public viewing of follow relationships
-- This is needed for the API to display follower/following counts on user profiles

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their follows" ON follows;

-- Create a new policy that allows public viewing of follow relationships
-- This is necessary for displaying follower/following counts on user profiles
CREATE POLICY "Anyone can view follow relationships"
    ON follows FOR SELECT
    USING (true);

-- Keep the existing policies for other operations
-- Users can follow others
-- Users can update their own follow requests  
-- Users can unfollow 