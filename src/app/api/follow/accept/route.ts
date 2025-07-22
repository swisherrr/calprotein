import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { followId } = await request.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Update follow status to accepted (only if user is the followed)
  const { error } = await supabase
    .from('follows')
    .update({ status: 'accepted' })
    .eq('id', followId)
    .eq('followed_id', user.id)
    .eq('status', 'pending');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 