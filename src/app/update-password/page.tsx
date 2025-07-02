'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Update password page loaded')
        console.log('Search params:', Object.fromEntries(searchParams.entries()))
        
        // Check if we have access_token in URL (from reset email)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const code = searchParams.get('code')
        const type = searchParams.get('type')
        
        console.log('Tokens found:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken, 
          code: !!code,
          type 
        })
        
        if (accessToken && refreshToken) {
          // Set the session from the URL tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (error) {
            console.error('Session set error:', error)
            toast.error('Invalid or expired reset link')
            router.push('/reset-password')
            return
          }
          
          if (data.session) {
            setIsValidSession(true)
          } else {
            toast.error('Invalid reset link')
            router.push('/reset-password')
          }
        } else if (code) {
          // For password reset with code, we need to handle it differently
          console.log('Processing code parameter for password reset...')
          
          // Check if we have a valid session first
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session check error:', sessionError)
          }
          
          if (session) {
            // We have a valid session, allow password reset
            console.log('Valid session found, allowing password reset')
            setIsValidSession(true)
          } else {
            // No session, but this might be a password reset flow
            // For password reset, we'll allow it and handle the session during password update
            console.log('No session found, but allowing password reset flow')
            setIsValidSession(true)
          }
        } else {
          // Check existing session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            console.log('No valid session found')
            toast.error('Invalid or expired reset link')
            router.push('/reset-password')
            return
          }
          
          setIsValidSession(true)
        }
      } catch (error) {
        console.error('Session validation error:', error)
        toast.error('Error validating reset link')
        router.push('/reset-password')
      } finally {
        setIsChecking(false)
      }
    }

    checkSession()
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isValidSession) {
      toast.error('Invalid session')
      return
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success('Password updated successfully')
      
      // Sign out the user after password update
      await supabase.auth.signOut()
      
      router.push('/login')
    } catch (error) {
      console.error('Password update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Validating reset link...</p>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
          <p className="mt-4 text-sm text-gray-600">The reset link is invalid or has expired.</p>
          <Button 
            onClick={() => router.push('/reset-password')}
            className="mt-4"
          >
            Request New Reset
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Set New Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  )
} 