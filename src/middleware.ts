import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Redirect from www.gainerithm.com to gainerithm.com
  if (req.nextUrl.hostname === 'www.gainerithm.com') {
    const newUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, 'https://gainerithm.com')
    return NextResponse.redirect(newUrl)
  }

  // Debug: Log cookies and request info
  console.log('--- Middleware Debug ---')
  console.log('Request URL:', req.url)
  console.log('Request Hostname:', req.nextUrl.hostname)
  console.log('Request Pathname:', req.nextUrl.pathname)
  console.log('Request Cookies:', req.cookies.getAll())

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Debug: Log session state
  console.log('Supabase session:', session)

  // Check for demo mode cookie
  const demoMode = req.cookies.get('demo-mode')?.value === 'true'

  // Allow access to demo route
  if (req.nextUrl.pathname === '/demo') {
    return res
  }

  // Allow dashboard access if in demo mode or authenticated
  if (!session && !demoMode && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('No session or demo mode, redirecting to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Set demo mode cookie if coming from demo route
  if (req.nextUrl.pathname.startsWith('/dashboard') && demoMode) {
    res.cookies.set('demo-mode', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/demo']
} 