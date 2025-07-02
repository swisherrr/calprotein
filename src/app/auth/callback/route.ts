import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('Auth callback received:', { code: !!code, next, origin })

  if (code) {
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

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/reset-password?error=invalid_code`)
      }

      if (data.session) {
        console.log('Auth callback successful, redirecting to:', next)
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('No session after code exchange')
        return NextResponse.redirect(`${origin}/reset-password?error=no_session`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(`${origin}/reset-password?error=exception`)
    }
  }

  // No code provided
  console.error('No code provided in auth callback')
  return NextResponse.redirect(`${origin}/reset-password?error=no_code`)
} 