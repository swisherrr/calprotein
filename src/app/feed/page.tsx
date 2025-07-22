"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProfilePicture from "@/components/ui/profile-picture";
import { MessageCircle, Heart } from "lucide-react";

export default function FeedPage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likeCounts, setLikeCounts] = useState<{[postId: string]: number}>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<{[postId: string]: number}>({});
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    } else {
      return postDate.toLocaleString();
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        return;
      }
      // Get users the current user follows (accepted only)
      const { data: following } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');
      const followedIds = following?.map(f => f.followed_id) || [];
      
      // Include current user in the list of users to fetch posts from
      const allUserIds = [...followedIds, user.id];
      
      // Get posts from followed users AND current user
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          shared_workouts!workout_id(*),
          progress_pictures!progress_picture_id(*)
        `)
        .in('user_id', allUserIds)
        .order('created_at', { ascending: false });
      
      // Filter out hidden and deleted content
      let filteredPosts = posts || [];
      if (filteredPosts.length > 0) {
        // Get hidden and deleted content for all users (including current user)
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, hidden_workouts, deleted_workouts, hidden_progress_pictures, deleted_progress_pictures')
          .in('user_id', allUserIds);

        if (userProfiles) {
          const hiddenWorkouts = new Set<string>();
          const deletedWorkouts = new Set<string>();
          const hiddenPictures = new Set<string>();
          const deletedPictures = new Set<string>();
          
          userProfiles.forEach(profile => {
            if (profile.hidden_workouts) {
              profile.hidden_workouts.forEach((id: string) => hiddenWorkouts.add(id));
            }
            if (profile.deleted_workouts) {
              profile.deleted_workouts.forEach((id: string) => deletedWorkouts.add(id));
            }
            if (profile.hidden_progress_pictures) {
              profile.hidden_progress_pictures.forEach((id: string) => hiddenPictures.add(id));
            }
            if (profile.deleted_progress_pictures) {
              profile.deleted_progress_pictures.forEach((id: string) => deletedPictures.add(id));
            }
          });
          
          filteredPosts = filteredPosts.filter(post => {
            if (post.post_type === 'workout' && post.shared_workouts) {
              return !hiddenWorkouts.has(post.shared_workouts.id) && !deletedWorkouts.has(post.shared_workouts.id);
            } else if (post.post_type === 'progress' && post.progress_pictures) {
              return !hiddenPictures.has(post.progress_pictures.id) && !deletedPictures.has(post.progress_pictures.id);
            }
            return true;
          });
        }
      }
      
      // Get usernames for all users
      const { data: userProfilesForUsernames } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', allUserIds);
      
      const usernameMap = new Map<string, string>();
      userProfilesForUsernames?.forEach(profile => {
        usernameMap.set(profile.user_id, profile.username);
      });
      
      // Process posts and add usernames
      const allPosts = filteredPosts.map(post => {
        const username = usernameMap.get(post.user_id) || post.user_id;
        
        if (post.post_type === 'workout' && post.shared_workouts) {
          return {
            ...post.shared_workouts,
            post_id: post.id,
            type: 'workout',
            username,
            user_id: post.user_id,
            created_at: post.created_at
          };
        } else if (post.post_type === 'progress' && post.progress_pictures) {
          return {
            ...post.progress_pictures,
            post_id: post.id,
            type: 'progress',
            username,
            user_id: post.user_id,
            created_at: post.created_at
          };
        }
        return null;
      }).filter(Boolean);
      
      setFeed(allPosts || []);
      setLoading(false);
    };
    fetchFeed();
  }, []);

  useEffect(() => {
    if (!feed.length) return;
    // Fetch like counts and whether current user liked each post
    const fetchLikesAndComments = async () => {
      const postIds = feed.map(p => p.post_id);
      // Likes
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);
      const counts: {[postId: string]: number} = {};
      const liked = new Set<string>();
      likes?.forEach(like => {
        counts[like.post_id] = (counts[like.post_id] || 0) + 1;
        if (like.user_id === currentUser?.id) liked.add(like.post_id);
      });
      setLikeCounts(counts);
      setLikedPosts(liked);
      // Comments
      const { data: comments } = await supabase
        .from('post_comments')
        .select('post_id');
      const commentCounts: {[postId: string]: number} = {};
      comments?.forEach(c => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
      });
      setCommentCounts(commentCounts);
    };
    fetchLikesAndComments();
  }, [feed, currentUser]);

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    
    try {
      if (likedPosts.has(postId)) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', postId);
        
        if (deleteError) {
          console.error('Error unliking post:', deleteError);
          return;
        }
        
        // Update UI immediately
        setLikeCounts(lc => ({ ...lc, [postId]: Math.max(0, (lc[postId] || 0) - 1) }));
        setLikedPosts(lp => {
          const newSet = new Set(lp);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({ user_id: currentUser.id, post_id: postId });
        
        if (insertError) {
          console.error('Error liking post:', insertError);
          return;
        }
        
        // Update UI immediately
        setLikeCounts(lc => ({ ...lc, [postId]: (lc[postId] || 0) + 1 }));
        setLikedPosts(lp => {
          const newSet = new Set(lp);
          newSet.add(postId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const openComments = async (postId: string) => {
    setShowCommentsFor(postId);
    const { data: comments } = await supabase
      .from('post_comments')
      .select('*, user_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    if (comments && comments.length > 0) {
      // Get usernames for comment authors
      const commentUserIds = comments.map(c => c.user_id);
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .in('user_id', commentUserIds);
      
      const usernameMap = new Map<string, string>();
      userProfiles?.forEach(profile => {
        usernameMap.set(profile.user_id, profile.username);
      });
      
      // Add usernames to comments
      const commentsWithUsernames = comments.map(comment => ({
        ...comment,
        username: usernameMap.get(comment.user_id) || comment.user_id
      }));
      
      setComments(commentsWithUsernames);
    } else {
      setComments([]);
    }
  };
  const handleAddComment = async () => {
    if (!currentUser || !showCommentsFor || !newComment.trim()) return;
    await supabase.from('post_comments').insert({ post_id: showCommentsFor, user_id: currentUser.id, content: newComment.trim() });
    setNewComment("");
    openComments(showCommentsFor);
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
      ) : feed.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400">No posts yet. Start by sharing a workout or posting a progress picture!</div>
      ) : (
        <div className="space-y-6">
          {feed.map((post) => (
            <div key={post.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black">
              {/* User info */}
              <div className="flex items-center gap-2 mb-2">
                <ProfilePicture userId={post.user_id} size="sm" />
                <Link href={`/user/${post.username}`} className="font-medium text-gray-900 dark:text-gray-100 hover:underline">@{post.username}</Link>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{formatRelativeTime(post.created_at)}</span>
              </div>
              
              {/* Post content based on type */}
              {post.type === 'workout' ? (
                <>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">{post.template_name}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Volume: {post.total_volume?.toLocaleString()} lbs</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{post.duration}</div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <img 
                      src={post.image_url} 
                      alt="Progress Picture" 
                      className="w-full max-w-md h-auto rounded-lg"
                    />
                  </div>
                  {post.caption && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{post.caption}</div>
                  )}
                </>
              )}
              
              {/* Like and comment buttons */}
              <div className="flex items-center gap-4 mt-2">
                <button onClick={() => handleLike(post.post_id)} className="flex items-center gap-1 text-red-500">
                  <Heart className={`h-5 w-5 ${likedPosts.has(post.post_id) ? 'fill-red-500' : 'stroke-red-500'}`} />
                  <span className="text-sm">{likeCounts[post.post_id] || 0}</span>
                </button>
                <button onClick={() => openComments(post.post_id)} className="flex items-center gap-1 text-blue-500">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">{commentCounts[post.post_id] || 0}</span>
                </button>
              </div>
              {/* Comments modal */}
              {showCommentsFor === post.post_id && (
                <div className="mt-4 border-t pt-4">
                  <div className="mb-2 font-medium">Comments</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-xs text-gray-500">No comments yet.</div>
                    ) : comments.map(c => (
                      <div key={c.id} className="text-sm text-gray-900 dark:text-gray-100 border-b pb-1">
                        <span className="font-medium">@{c.username}</span>: {c.content}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>Post</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 