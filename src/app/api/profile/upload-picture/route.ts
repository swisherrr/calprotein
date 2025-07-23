import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {}
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {}
          },
        },
      }
    )
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' }, { status: 400 })
    }

    // Validate file size (max 2MB for compressed images)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Please upload an image smaller than 2MB.' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    // Skip bucket check since user confirmed bucket exists in dashboard
    console.log('Proceeding with upload to profile-pictures bucket')

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('Upload response:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName)

    // Update user profile with the new picture URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_picture_url: publicUrl })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: `Failed to update profile: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    })

  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {}
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {}
          },
        },
      }
    )
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile picture URL
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('profile_picture_url')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // If there's a profile picture, delete it from storage
    if (profile?.profile_picture_url) {
      // Extract filename from URL
      const urlParts = profile.profile_picture_url.split('/')
      const fileName = urlParts[urlParts.length - 1]

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName])

      if (deleteError) {
        console.error('Delete error:', deleteError)
        // Continue anyway to reset the profile
      }
    }

    // Reset profile picture URL to null
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_picture_url: null })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to reset profile picture' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Profile picture reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 