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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 10;

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        if (!user) {
          setLoading(false);
          return;
        }

        // Get users the current user follows (accepted only) - limit to recent follows for performance
        const { data: following } = await supabase
          .from('follows')
          .select('followed_id')
          .eq('follower_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(50); // Limit to recent 50 follows for performance

        const followedIds = following?.map(f => f.followed_id) || [];
        const allUserIds = [...followedIds, user.id];
        
        if (allUserIds.length === 0) {
          setLoading(false);
          return;
        }

        // Get posts with pagination
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            shared_workouts!workout_id(*),
            progress_pictures!progress_picture_id(*)
          `)
          .in('user_id', allUserIds)
          .order('created_at', { ascending: false })
          .range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1);

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          setLoading(false);
          return;
        }

        // Filter out hidden and deleted content efficiently
        let filteredPosts = posts || [];
        if (filteredPosts.length > 0) {
          // Get hidden and deleted content for all users in one query
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
        
        // Get usernames for all users in one query
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
        
        if (page === 0) {
          setFeed(allPosts || []);
        } else {
          setFeed(prev => [...prev, ...(allPosts || [])]);
        }
        
        setHasMore((allPosts || []).length === POSTS_PER_PAGE);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching feed:', error);
        setLoading(false);
      }
    };
    fetchFeed();
  }, [page]);

  // Load likes and comments for the current feed
  useEffect(() => {
    if (feed.length === 0) return;
    
    const fetchLikesAndComments = async () => {
      try {
        const postIds = feed.map(post => post.post_id);
        
        // Fetch likes and comments in parallel
        const [likesResponse, commentsResponse] = await Promise.all([
          supabase
            .from('post_likes')
            .select('post_id')
            .in('post_id', postIds),
          supabase
            .from('post_comments')
            .select('post_id')
            .in('post_id', postIds)
        ]);

        // Process likes
        const likeCountMap: {[postId: string]: number} = {};
        likesResponse.data?.forEach(like => {
          likeCountMap[like.post_id] = (likeCountMap[like.post_id] || 0) + 1;
        });
        setLikeCounts(likeCountMap);

        // Process comments
        const commentCountMap: {[postId: string]: number} = {};
        commentsResponse.data?.forEach(comment => {
          commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
        });
        setCommentCounts(commentCountMap);

        // Check which posts the current user has liked
        if (currentUser) {
          const { data: userLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .in('post_id', postIds)
            .eq('user_id', currentUser.id);
          
          const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);
          setLikedPosts(likedPostIds);
        }
      } catch (error) {
        console.error('Error fetching likes and comments:', error);
      }
    };

    fetchLikesAndComments();
  }, [feed, currentUser]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const isLiked = likedPosts.has(postId);
      
      if (isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        
        setLikeCounts(prev => ({
          ...prev,
          [postId]: Math.max(0, (prev[postId] || 0) - 1)
        }));
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: currentUser.id
          }]);
        
        setLikedPosts(prev => new Set([...prev, postId]));
        
        setLikeCounts(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const openComments = async (postId: string) => {
    if (showCommentsFor === postId) {
      setShowCommentsFor(null);
      setComments([]);
      return;
    }

    try {
      setShowCommentsFor(postId);
      
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select(`*`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      // Fetch user profile for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('username, profile_picture_url')
            .eq('user_id', comment.user_id)
            .single();
          return {
            ...comment,
            user_profiles: userProfile || {},
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error opening comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !showCommentsFor || !newComment.trim()) return;

    try {
      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: showCommentsFor,
          user_id: currentUser.id,
          content: newComment.trim()
        }])
        .select(`*`)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Fetch user profile for the new comment
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('username, profile_picture_url')
        .eq('user_id', comment.user_id)
        .single();

      setComments(prev => [...prev, { ...comment, user_profiles: userProfile || {} }]);
      setCommentCounts(prev => ({
        ...prev,
        [showCommentsFor]: (prev[showCommentsFor] || 0) + 1
      }));
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading && page === 0) {
    return (
      <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
        <div className="text-center text-gray-500 dark:text-gray-400">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black pb-8">
      {/* Header */}
      <div className="w-full max-w-2xl px-4 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Feed</h1>
        </div>
      </div>

      {/* Feed Content */}
      <div className="w-full max-w-md px-4">
        {feed.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Follow some users to see their posts here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {feed.map((post) => (
              <div
                key={post.post_id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black p-4"
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/user/${post.username}`} className="hover:opacity-80 transition-opacity">
                    <ProfilePicture
                      pictureUrl={post.profile_picture_url}
                      size="sm"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link 
                      href={`/user/${post.username}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      @{post.username}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                {post.type === 'workout' ? (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {post.template_name}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Volume</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {post.total_volume?.toLocaleString() || '0'} lbs
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {post.duration || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Exercises</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {post.exercises?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Progress"
                        className="w-full max-w-sm h-auto rounded-lg mb-3"
                      />
                    )}
                    {post.caption && (
                      <p className="text-gray-900 dark:text-gray-100">{post.caption}</p>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleLike(post.post_id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      likedPosts.has(post.post_id)
                        ? 'text-red-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedPosts.has(post.post_id) ? 'fill-current' : ''}`} />
                    {likeCounts[post.post_id] || 0}
                  </button>
                  
                  <button
                    onClick={() => openComments(post.post_id)}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {commentCounts[post.post_id] || 0}
                  </button>
                </div>

                {/* Comments Section */}
                {showCommentsFor === post.post_id && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                                                     <ProfilePicture
                             pictureUrl={comment.user_profiles?.profile_picture_url}
                             size="sm"
                           />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                @{comment.user_profiles?.username}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatRelativeTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-black text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 