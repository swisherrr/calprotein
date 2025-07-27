import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  
  // If we're on the wrong domain, redirect to the correct one
  if (origin.includes('www.gainerithm.com')) {
    const redirectUrl = new URL('https://gainerithm.com/auth/callback', request.url)
    redirectUrl.searchParams.set('code', code || '')
    if (next) redirectUrl.searchParams.set('next', next)
    return NextResponse.redirect(redirectUrl)
  }



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
            } catch (error) {
              console.error('Cookie set error:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )

    try {

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        // For password reset, try a different approach
        if (next === '/update-password') {
          return NextResponse.redirect(`${origin}/update-password?code=${code}`)
        }
        return NextResponse.redirect(`${origin}/reset-password?error=invalid_code`)
      }

      if (data.session) {

        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('No session after code exchange')
        if (next === '/update-password') {
          return NextResponse.redirect(`${origin}/update-password?code=${code}`)
        }
        return NextResponse.redirect(`${origin}/reset-password?error=no_session`)
      }
    } catch (error) {
      console.error('Auth callback exception:', error)
      if (next === '/update-password') {
        return NextResponse.redirect(`${origin}/update-password?code=${code}`)
      }
      return NextResponse.redirect(`${origin}/reset-password?error=exception`)
    }
  }

  // No code provided
  console.error('No code provided in auth callback')
  return NextResponse.redirect(`${origin}/reset-password?error=no_code`)
} 