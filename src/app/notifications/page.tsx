"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Bell, UserPlus, Check, X, Users } from "lucide-react"
import ProfilePicture from "@/components/ui/profile-picture"

interface FollowRequest {
  id: string
  follower_id: string
  followed_id: string
  status: string
  created_at: string
  follower_username?: string
  follower_profile_picture?: string
}

interface FollowerNotification {
  id: string
  follower_id: string
  followed_id: string
  status: string
  created_at: string
  follower_username?: string
  follower_profile_picture?: string
}

export default function NotificationsPage() {
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [followerNotifications, setFollowerNotifications] = useState<FollowerNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function fetchUserAndRequests() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user)
          await Promise.all([
            fetchFollowRequests(user.id),
            fetchFollowerNotifications(user.id)
          ])
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndRequests()
  }, [])

  const fetchFollowRequests = async (userId: string) => {
    try {
      // Get pending follow requests where this user is the followed
      const { data: requests, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          followed_id,
          status,
          created_at
        `)
        .eq('followed_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50) // Limit to recent 50 requests for performance

      if (error) {
        console.error('Error fetching follow requests:', error)
        return
      }

      // Get follower details for each request
      const transformedRequests = await Promise.all(
        (requests || []).map(async (request) => {
          const { data: followerProfile } = await supabase
            .from('user_profiles')
            .select('username, profile_picture_url')
            .eq('user_id', request.follower_id)
            .single()

          return {
            id: request.id,
            follower_id: request.follower_id,
            followed_id: request.followed_id,
            status: request.status,
            created_at: request.created_at,
            follower_username: followerProfile?.username,
            follower_profile_picture: followerProfile?.profile_picture_url
          }
        })
      )

      setFollowRequests(transformedRequests)
    } catch (error) {
      console.error('Error fetching follow requests:', error)
    }
  }

  const fetchFollowerNotifications = async (userId: string) => {
    try {
      // Get recent accepted follows where this user is the followed (for public accounts)
      // Only show follows from the last 7 days to avoid overwhelming the user
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: followers, error } = await supabase
        .from('follows')
        .select(`
          id,
          follower_id,
          followed_id,
          status,
          created_at
        `)
        .eq('followed_id', userId)
        .eq('status', 'accepted')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20) // Limit to recent 20 followers

      if (error) {
        console.error('Error fetching follower notifications:', error)
        return
      }

      // Get follower details for each notification
      const transformedFollowers = await Promise.all(
        (followers || []).map(async (follower) => {
          const { data: followerProfile } = await supabase
            .from('user_profiles')
            .select('username, profile_picture_url')
            .eq('user_id', follower.follower_id)
            .single()

          return {
            id: follower.id,
            follower_id: follower.follower_id,
            followed_id: follower.followed_id,
            status: follower.status,
            created_at: follower.created_at,
            follower_username: followerProfile?.username,
            follower_profile_picture: followerProfile?.profile_picture_url
          }
        })
      )

      setFollowerNotifications(transformedFollowers)
    } catch (error) {
      console.error('Error fetching follower notifications:', error)
    }
  }

  const handleAccept = async (followId: string) => {
    try {
      const response = await fetch('/api/follow/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followId })
      })

      if (response.ok) {
        // Remove the accepted request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== followId))
      } else {
        console.error('Failed to accept follow request')
      }
    } catch (error) {
      console.error('Error accepting follow request:', error)
    }
  }

  const handleReject = async (followId: string) => {
    try {
      const response = await fetch('/api/follow/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followId })
      })

      if (response.ok) {
        // Remove the rejected request from the list
        setFollowRequests(prev => prev.filter(req => req.id !== followId))
      } else {
        console.error('Failed to reject follow request')
      }
    } catch (error) {
      console.error('Error rejecting follow request:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
        <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black pb-8">
      {/* Header */}
      <div className="w-full max-w-2xl px-4 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h1>
        </div>
      </div>

      {/* Follow Requests Section */}
      <div className="w-full max-w-2xl px-4 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Follow Requests</h2>
          {followRequests.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {followRequests.length}
            </span>
          )}
        </div>

        {followRequests.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No pending follow requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {followRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/user/${request.follower_username}`} className="hover:opacity-80 transition-opacity">
                    <ProfilePicture
                      pictureUrl={request.follower_profile_picture}
                      size="md"
                    />
                  </Link>
                  <div>
                    <Link 
                      href={`/user/${request.follower_username}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      @{request.follower_username || 'Unknown User'}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      wants to follow you
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Followers Section */}
      <div className="w-full max-w-2xl px-4">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Followers</h2>
          {followerNotifications.length > 0 && (
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {followerNotifications.length}
            </span>
          )}
        </div>

        {followerNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No recent followers</p>
          </div>
        ) : (
          <div className="space-y-4">
            {followerNotifications.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/user/${follower.follower_username}`} className="hover:opacity-80 transition-opacity">
                    <ProfilePicture
                      pictureUrl={follower.follower_profile_picture}
                      size="md"
                    />
                  </Link>
                  <div>
                    <Link 
                      href={`/user/${follower.follower_username}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      @{follower.follower_username || 'Unknown User'}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      started following you
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(follower.created_at).toLocaleDateString()} at {new Date(follower.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 