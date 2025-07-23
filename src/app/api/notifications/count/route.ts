import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get count of pending follow requests where this user is the followed
    const { count: followRequestsCount, error: followRequestsError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', user.id)
      .eq('status', 'pending');

    if (followRequestsError) {
      console.error('Error fetching follow requests count:', followRequestsError);
      return NextResponse.json({ error: 'Failed to fetch notification count' }, { status: 500 });
    }

    // Get count of recent followers (last 7 days) where this user is the followed
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentFollowersCount, error: recentFollowersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', user.id)
      .eq('status', 'accepted')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentFollowersError) {
      console.error('Error fetching recent followers count:', recentFollowersError);
      return NextResponse.json({ error: 'Failed to fetch notification count' }, { status: 500 });
    }

    const totalCount = (followRequestsCount || 0) + (recentFollowersCount || 0);

    return NextResponse.json({ count: totalCount });
  } catch (error) {
    console.error('Error in notification count API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 