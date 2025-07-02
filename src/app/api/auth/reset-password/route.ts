import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
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

    // Get the correct origin based on environment
    let origin: string
    if (process.env.NODE_ENV === 'production') {
      origin = 'https://liftayltics.net'
    } else {
      // For development, use the request origin or fallback to localhost:3001
      origin = request.headers.get('origin') || 'http://localhost:3001'
    }
    
    // Direct redirect to update password page - no auth callback
    const redirectTo = `${origin}/update-password`

    console.log('Reset password request details:')
    console.log('- Email:', email)
    console.log('- Origin:', origin)
    console.log('- Redirect URL:', redirectTo)
    console.log('- Environment:', process.env.NODE_ENV)

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