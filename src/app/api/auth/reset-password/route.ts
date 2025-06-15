import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the current URL from the request headers
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

    // Make sure to use the full URL with the correct path
    const redirectTo = `${origin}/update-password`

    console.log('Attempting to send reset email to:', email)
    console.log('Using redirect URL:', redirectTo)

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error('Supabase reset password error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('Reset email sent successfully:', data)
    return NextResponse.json({ message: 'Password reset email sent' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to send reset email' },
      { status: 500 }
    )
  }
} 