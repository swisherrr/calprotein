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

    // Use the correct production URL for password reset
    let redirectTo: string
    if (process.env.NODE_ENV === 'production') {
      redirectTo = 'https://gainerithm.com/update-password'
    } else {
      const origin = request.headers.get('origin') || 'http://localhost:3001'
      redirectTo = `${origin}/update-password`
    }

    console.log('About to call Supabase resetPasswordForEmail with:', {
      email,
      redirectTo,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    })

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error('Supabase reset password error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
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