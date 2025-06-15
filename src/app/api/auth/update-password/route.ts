import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // First verify the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Sign out to clear the session
    await supabase.auth.signOut()

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    )
  }
} 