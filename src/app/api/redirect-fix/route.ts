import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  
  // Redirect to the correct domain with the same parameters
  const redirectUrl = new URL('https://gainerithm.com/update-password', request.url)
  
  if (code) {
    redirectUrl.searchParams.set('code', code)
  }
  
  if (type) {
    redirectUrl.searchParams.set('type', type)
  }
  
  return NextResponse.redirect(redirectUrl)
} 