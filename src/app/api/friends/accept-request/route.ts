import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the friend request
    const { data: friendRequest, error: requestError } = await supabase
      .from('friendship_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .single();

    if (requestError || !friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found or already processed' },
        { status: 404 }
      );
    }

    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('friendship_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating friend request:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept friend request' },
        { status: 500 }
      );
    }

    // Create friendship record
    const user1Id = user.id < friendRequest.sender_id ? user.id : friendRequest.sender_id;
    const user2Id = user.id < friendRequest.sender_id ? friendRequest.sender_id : user.id;

    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id
      });

    if (friendshipError) {
      console.error('Error creating friendship:', friendshipError);
      return NextResponse.json(
        { error: 'Failed to create friendship' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in accept-request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 