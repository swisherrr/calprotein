"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Prevent multiple submissions
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      // Add a small delay to ensure mobile touch events are processed
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data?.session) {
        window.location.href = '/dashboard'
      } else {
        setError('Login failed. Please try again.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during sign in. Please try again.')
      setLoading(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent default button behavior and manually submit form
    e.preventDefault()
    e.stopPropagation()
    
    if (formRef.current && !loading) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="card-apple">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            Sign in to continue your fitness journey
          </p>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label 
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-apple"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-apple pr-12"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.221 1.125-4.575m1.664-2.13A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.221-1.125 4.575m-1.664 2.13A9.956 9.956 0 0112 21c-1.657 0-3.221-.403-4.575-1.125m-2.13-1.664A9.956 9.956 0 013 12c0-1.657.403-3.221 1.125-4.575m2.13-2.13A9.956 9.956 0 0112 3c1.657 0 3.221.403 4.575 1.125m2.13 1.664A9.956 9.956 0 0121 12c0 1.657-.403 3.221-1.125 4.575m-2.13 2.13A9.956 9.956 0 0112 21c-1.657 0-3.221-.403-4.575-1.125" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
            <Link 
              href="/reset-password" 
              className="text-sm font-medium text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button 
            type="button"
            onClick={handleButtonClick}
            className="btn-apple w-full text-lg py-4 flex items-center justify-center" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="font-medium text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 