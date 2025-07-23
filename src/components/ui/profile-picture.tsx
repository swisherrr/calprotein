"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import OptimizedImage from './optimized-image'

interface ProfilePictureProps {
  userId?: string
  pictureUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

export default function ProfilePicture({
  userId,
  pictureUrl,
  size = 'md',
  className = '',
  onClick
}: ProfilePictureProps) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(pictureUrl || null)
  const [loading, setLoading] = useState(false)

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24'
  }

  // Container size classes
  const containerSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-28 h-28'
  }

  useEffect(() => {
    // If pictureUrl is provided, use it directly
    if (pictureUrl !== undefined) {
      setProfilePictureUrl(pictureUrl)
      return
    }

    // If userId is provided but no pictureUrl, fetch the profile
    if (userId && !pictureUrl) {
      fetchProfilePicture()
    }
  }, [userId, pictureUrl])

  const fetchProfilePicture = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('profile_picture_url')
        .eq('user_id', userId)
        .single()

      if (!error && profile) {
        setProfilePictureUrl(profile.profile_picture_url)
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      className={`${containerSizeClasses[size]} rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-900 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={handleClick}
    >
      {loading ? (
        <div className={`${sizeClasses[size]} animate-pulse bg-gray-300 dark:bg-gray-600 rounded-full`} />
      ) : profilePictureUrl ? (
        <OptimizedImage
          src={profilePictureUrl}
          alt="Profile"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 96}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 96}
          className={`${sizeClasses[size]} object-cover rounded-full`}
          style={{ display: 'block' }}
        />
      ) : (
        <OptimizedImage
          src="/profile-placeholder.jpg"
          alt="Profile"
          width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 96}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 48 : 96}
          className={`${sizeClasses[size]} object-cover rounded-full`}
          style={{ display: 'block' }}
        />
      )}
    </div>
  )
} 