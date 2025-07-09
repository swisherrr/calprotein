import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      )
    }

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

    // Check if username already exists in user_profiles table (primary check)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile username:', profileError)
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      )
    }

    // If username exists in user_profiles, it's taken
    if (profileData) {
      return NextResponse.json({ 
        available: false,
        message: 'Username is already taken'
      })
    }

    // Try to check auth.users metadata as a secondary check
    // Note: This might not work due to permissions, but we'll try
    try {
      const { data: authData, error: authError } = await supabase
        .from('auth.users')
        .select('raw_user_meta_data')
        .eq('raw_user_meta_data->username', username)
        .single()

      if (authError && authError.code !== 'PGRST116') {
        // If we can't access auth.users, we'll rely on the user_profiles check
        console.log('Could not check auth.users table, relying on user_profiles check')
      } else if (authData) {
        // Username exists in auth.users metadata
        return NextResponse.json({ 
          available: false,
          message: 'Username is already taken'
        })
      }
    } catch (error) {
      // If we can't access auth.users table, that's okay - we'll rely on user_profiles
      console.log('Auth users table not accessible, relying on user_profiles check')
    }

    // Username is available
    return NextResponse.json({ 
      available: true,
      message: 'Username is available'
    })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    )
  }
} 