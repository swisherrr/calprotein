import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  const supabase = createClient();

  // Followers: users who follow this user
  const { data: followers, error: followersError } = await supabase
    .from('follows')
    .select('id, follower_id, status')
    .eq('followed_id', userId);

  // Following: users this user follows
  const { data: following, error: followingError } = await supabase
    .from('follows')
    .select('id, followed_id, status')
    .eq('follower_id', userId);

  if (followersError || followingError) {
    return NextResponse.json({ error: 'Failed to fetch followers/following' }, { status: 500 });
  }

  return NextResponse.json({ followers, following });
} 