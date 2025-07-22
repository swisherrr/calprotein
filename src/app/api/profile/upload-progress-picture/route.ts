import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, caption } = await request.json();
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Insert progress picture
    const { data: progressPicture, error: progressError } = await supabase
      .from('progress_pictures')
      .insert([
        {
          user_id: user.id,
          image_url: imageUrl,
          caption: caption || null,
        }
      ])
      .select()
      .single();

    if (progressError) {
      console.error('Error inserting progress picture:', progressError);
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    // Create post entry for the feed
    const { error: postError } = await supabase
      .from('posts')
      .insert([
        {
          user_id: user.id,
          post_type: 'progress',
          progress_picture_id: progressPicture.id,
        }
      ]);

    if (postError) {
      console.error('Error creating post entry:', postError);
      // Don't fail the request if post creation fails, just log it
    }

    return NextResponse.json({ success: true, data: progressPicture });
  } catch (error) {
    console.error('Error in upload-progress-picture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 