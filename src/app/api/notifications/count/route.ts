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
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching notification count:', error);
      return NextResponse.json({ error: 'Failed to fetch notification count' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in notification count API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 