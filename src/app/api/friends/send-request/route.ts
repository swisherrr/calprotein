import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { receiverId } = await request.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
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

    // Check if any request already exists between these users
    const { data: existingRequest } = await supabase
      .from('friendship_requests')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .single();

    if (existingRequest) {
      // If there's a pending request, don't allow a new one
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already exists' },
          { status: 400 }
        );
      }
      
      // If there's a rejected request, update it to pending
      if (existingRequest.status === 'rejected') {
        console.log('Updating rejected request to pending:', existingRequest.id);
        console.log('Current request status:', existingRequest.status);
        
        const { data: updateData, error: updateError } = await supabase
          .from('friendship_requests')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRequest.id)
          .select();

        if (updateError) {
          console.error('Error updating rejected request:', updateError);
          return NextResponse.json(
            { error: 'Failed to update friend request' },
            { status: 500 }
          );
        }

        console.log('Request updated successfully:', updateData);
        return NextResponse.json({ success: true });
      }
      
      // If there's an accepted request, don't allow a new one
      if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already friends with this user' },
          { status: 400 }
        );
      }
    }

    // Send friend request
    console.log('Attempting to insert friend request:', {
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    });

    const { data, error } = await supabase
      .from('friendship_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending'
      })
      .select();

    if (error) {
      console.error('Database error sending friend request:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to send friend request', details: error.message },
        { status: 500 }
      );
    }

    console.log('Friend request inserted successfully:', data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 