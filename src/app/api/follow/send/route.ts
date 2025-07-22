import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const { followedId } = await request.json();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check if followed user is private
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('private_account')
    .eq('user_id', followedId)
    .single();

  let status = 'accepted';
  if (profile?.private_account) status = 'pending';

  // Insert or update follow (as array)
  const { error } = await supabase
    .from('follows')
    .upsert([
      {
        follower_id: user.id,
        followed_id: followedId,
        status,
      }
    ], { onConflict: 'follower_id,followed_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, status });
} 