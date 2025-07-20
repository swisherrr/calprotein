"use client"

import React, { useState, useEffect } from "react";
import { Search, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  username: string;
  requestSent?: boolean;
}

interface Friend {
  id: string;
  username: string;
}

interface FriendshipRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_username?: string;
}

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    console.log('Friends page useEffect triggered');
    getCurrentUser();
    loadFriends();
    loadPendingRequests();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Get current user first to ensure we have it
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .ilike('username', `%${searchQuery}%`)
        .limit(10);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Filter out current user and existing friends
      const filteredResults = data?.filter(userProfile => 
        userProfile.user_id !== user.id && 
        !friends.some(friend => friend.id === userProfile.user_id)
      ) || [];

      // Check if any of these users already have pending requests from current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: existingRequests } = await supabase
          .from('friendship_requests')
          .select('receiver_id')
          .eq('sender_id', currentUser.id)
          .eq('status', 'pending')
          .in('receiver_id', filteredResults.map(u => u.user_id));

        const pendingUserIds = new Set(existingRequests?.map(r => r.receiver_id) || []);

        setSearchResults(filteredResults.map(userProfile => ({
          id: userProfile.user_id,
          username: userProfile.username,
          requestSent: pendingUserIds.has(userProfile.user_id)
        })));
      } else {
        setSearchResults(filteredResults.map(userProfile => ({
          id: userProfile.user_id,
          username: userProfile.username,
          requestSent: false
        })));
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      console.log('Sending friend request to user ID:', userId);
      
      const response = await fetch('/api/friends/send-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: userId }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        if (responseData.error === 'Friend request already exists') {
          console.log('Friend request already exists, updating UI');
          // If request already exists, just update the UI to show it
          setSearchResults(prev => prev.map(user => 
            user.id === userId 
              ? { ...user, requestSent: true }
              : user
          ));
          return;
        }
        throw new Error(responseData.error || 'Failed to send friend request');
      }

      console.log('Friend request sent successfully');
      // Update the user in search results to show request sent
      setSearchResults(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, requestSent: true }
          : user
      ));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get friendships where current user is either user1 or user2
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      // Get friend user IDs
      const friendIds = friendships?.map(friendship => 
        friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id
      ) || [];

      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      // Get friend profiles
      const { data: friendProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', friendIds);

      if (profilesError) throw profilesError;

      setFriends(friendProfiles?.map(profile => ({
        id: profile.user_id,
        username: profile.username
      })) || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in loadPendingRequests');
        return;
      }

      console.log('Loading pending requests for user:', user.id);

      const { data, error } = await supabase
        .from('friendship_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending requests:', error);
        throw error;
      }

      console.log('Raw pending requests data:', data);

      // Get sender usernames for all pending requests
      if (data && data.length > 0) {
        const senderIds = data.map(request => request.sender_id);
        console.log('Sender IDs:', senderIds);
        
        const { data: senderProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, username')
          .in('user_id', senderIds);

        if (profilesError) {
          console.error('Error fetching sender profiles:', profilesError);
          throw profilesError;
        }

        console.log('Sender profiles:', senderProfiles);

        // Create a map of user_id to username
        const usernameMap = new Map();
        senderProfiles?.forEach(profile => {
          usernameMap.set(profile.user_id, profile.username);
        });

        // Add usernames to the requests
        const requestsWithUsernames = data.map(request => ({
          ...request,
          sender_username: usernameMap.get(request.sender_id) || 'Unknown User'
        }));

        console.log('Final pending requests with usernames:', requestsWithUsernames);
        setPendingRequests(requestsWithUsernames);
      } else {
        console.log('No pending requests found');
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/friends/accept-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept friend request');
      }

      // Reload friends and pending requests
      await loadFriends();
      await loadPendingRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/friends/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject friend request');
      }

      // Reload pending requests
      await loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers();
  };

  const debugCheckRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('=== DEBUG: Checking all friendship requests ===');
      
      // Check all requests (not just pending)
      const { data: allRequests, error } = await supabase
        .from('friendship_requests')
        .select('*');

      if (error) {
        console.error('Error fetching all requests:', error);
        return;
      }

      console.log('All friendship requests in database:', allRequests);
      
      // Check requests where current user is receiver
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friendship_requests')
        .select('*')
        .eq('receiver_id', user.id);

      if (receivedError) {
        console.error('Error fetching received requests:', receivedError);
        return;
      }

      console.log('Requests where current user is receiver:', receivedRequests);
      console.log('Received request details:', JSON.stringify(receivedRequests, null, 2));
      
      // Check requests where current user is sender
      const { data: sentRequests, error: sentError } = await supabase
        .from('friendship_requests')
        .select('*')
        .eq('sender_id', user.id);

      if (sentError) {
        console.error('Error fetching sent requests:', sentError);
        return;
      }

      console.log('Requests where current user is sender:', sentRequests);
      console.log('Sent request details:', JSON.stringify(sentRequests, null, 2));

      // Try to manually update a rejected request to pending
      if (receivedRequests && receivedRequests.length > 0) {
        const rejectedRequest = receivedRequests.find(r => r.status === 'rejected');
        if (rejectedRequest) {
          console.log('=== DEBUG: Trying to manually update rejected request ===');
          console.log('Request to update:', rejectedRequest);
          
          const { data: updateData, error: updateError } = await supabase
            .from('friendship_requests')
            .update({ status: 'pending' })
            .eq('id', rejectedRequest.id)
            .select();

          if (updateError) {
            console.error('Manual update error:', updateError);
          } else {
            console.log('Manual update successful:', updateData);
          }
        }
      }
    } catch (error) {
      console.error('Error in debug function:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Friends</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Connect with other users and build your fitness community
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 mb-8 border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Users
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>
        
        {/* Debug button - remove this later */}
        <Button 
          onClick={debugCheckRequests} 
          variant="outline" 
          size="sm" 
          className="mb-4"
        >
          Debug: Check All Requests
        </Button>
        


        {/* Search Results */}
        {searchQuery.trim() && !isSearching && (
          <div className="space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  {user.requestSent ? (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Request Sent ✓
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(user.id)}
                      className="flex items-center gap-2"
                      disabled={user.requestSent}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
                <p>No users found matching "{searchQuery}"</p>
                <p className="text-sm mt-1">Try searching with a different username</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 mb-8 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">Friend Request</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Request from: {request.sender_username || 'Unknown User'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptFriendRequest(request.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectFriendRequest(request.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Friends ({friends.length})
        </h2>
        
        {friends.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400 text-center py-8">
            You haven't added any friends yet. Search for users above to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{friend.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 