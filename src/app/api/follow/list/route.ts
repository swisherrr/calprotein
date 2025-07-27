import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  const supabase = createClient();

  // Get all followers of the profile owner (people following them)
  const { data: allFollowers, error: allFollowersError } = await supabase
    .from('follows')
    .select('id, follower_id, status')
    .eq('followed_id', userId);

  // Get all people the profile owner is following
  const { data: allFollowing, error: allFollowingError } = await supabase
    .from('follows')
    .select('id, followed_id, status')
    .eq('follower_id', userId);



  if (allFollowersError || allFollowingError) {
    return NextResponse.json({ error: 'Failed to fetch followers/following' }, { status: 500 });
  }

  // Filter to only accepted relationships for counts
  const followers = allFollowers?.filter(f => f.status === 'accepted') || [];
  const following = allFollowing?.filter(f => f.status === 'accepted') || [];



  // Return both the counts (accepted only) and all relationships (for status checking)
  return NextResponse.json({ 
    followers, 
    following,
    allFollowers: allFollowers || [],
    allFollowing: allFollowing || []
  });
} 