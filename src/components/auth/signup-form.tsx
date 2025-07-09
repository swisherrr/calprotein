"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const router = useRouter()

  // Debounced username availability check
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null)
      setUsernameError(null)
      return
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens')
      setUsernameAvailable(false)
      return
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      setUsernameAvailable(false)
      return
    }

    if (username.length > 30) {
      setUsernameError('Username must be 30 characters or less')
      setUsernameAvailable(false)
      return
    }

    setUsernameError(null)
    setCheckingUsername(true)

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/auth/check-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }),
        })

        const data = await response.json()

        if (response.ok) {
          setUsernameAvailable(data.available)
          if (!data.available) {
            setUsernameError('Username is already taken')
          }
        } else {
          setUsernameError(data.error || 'Failed to check username')
          setUsernameAvailable(false)
        }
      } catch (error) {
        setUsernameError('Failed to check username availability')
        setUsernameAvailable(false)
      } finally {
        setCheckingUsername(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || usernameError || usernameAvailable === false) {
      setError('Please enter a valid username')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Starting signup process for username:', username)

      // Double-check username availability right before signup
      const availabilityResponse = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })

      const availabilityData = await availabilityResponse.json()
      console.log('Username availability check result:', availabilityData)

      if (!availabilityResponse.ok || !availabilityData.available) {
        setError('Username is no longer available. Please choose a different username.')
        setUsernameAvailable(false)
        setLoading(false)
        return
      }

      // Create the user account with username in metadata
      console.log('Creating auth user...')
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username // This will show in Supabase dashboard
          }
        }
      })

      console.log('Auth signup result:', { authData, signUpError })

      if (signUpError) {
        console.error('Auth signup error:', signUpError)
        // Check if the error is due to duplicate username or other issues
        if (signUpError.message.includes('duplicate key') ||
            signUpError.message.includes('unique constraint') ||
            signUpError.message.includes('already exists')) {
          setError('Username is already taken. Please choose a different username.')
          setUsernameAvailable(false)
        } else {
          throw signUpError
        }
        return
      }

      if (authData.user) {
        console.log('Auth user created successfully:', authData.user.id)
        
        // Create user profile with username
        console.log('Creating user profile...')
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            username: username,
            display_name: username // Fix: set display_name to username
          }])
          .select()

        console.log('Profile creation result:', { profileData, profileError })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // If profile creation fails due to duplicate username, clean up the auth user
          if (profileError.message.includes('duplicate key') || 
              profileError.message.includes('unique constraint') ||
              profileError.code === '23505') { // PostgreSQL unique violation code
            // Try to delete the auth user since profile creation failed
            try {
              // Note: We can't use supabase.auth.admin.deleteUser from client side
              // The auth user will remain, but the profile won't be created
              // This is acceptable since the unique constraint on user_profiles prevents duplicates
              console.log('Profile creation failed due to duplicate username, auth user remains')
            } catch (deleteError) {
              console.error('Could not clean up auth user:', deleteError)
            }
            setError('Username is already taken. Please choose a different username.')
            setUsernameAvailable(false)
            return
          }
          // For other profile errors, we might want to handle differently
          setError(`Account created but profile setup failed: ${profileError.message}`)
          return
        }

        if (profileData) {
          console.log('Profile created successfully:', profileData)
        }
      } else {
        console.error('No auth user data returned')
        setError('Failed to create user account')
        return
      }
      
      console.log('Signup completed successfully, redirecting...')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = email && password && username && usernameAvailable === true && !usernameError

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your details to get started
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label 
            htmlFor="username"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="johndoe"
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400 dark:focus:border-gray-600 ${
              usernameError 
                ? 'border-red-500 bg-white dark:bg-gray-800' 
                : usernameAvailable === true 
                ? 'border-green-500 bg-white dark:bg-gray-800' 
                : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
            required
          />
          {checkingUsername && (
            <div className="text-sm text-gray-500">Checking availability...</div>
          )}
          {usernameError && (
            <div className="text-sm text-red-500">{usernameError}</div>
          )}
          {usernameAvailable === true && (
            <div className="text-sm text-green-500">✓ Username is available</div>
          )}
        </div>
        
        <div className="space-y-2">
          <label 
            htmlFor="email"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="johndoe@example.com"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-600"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-gray-600"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || !isFormValid}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <a className="underline underline-offset-4 hover:text-gray-600" href="/login">
          Sign in
        </a>
      </div>
    </div>
  )
} 