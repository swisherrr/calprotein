"use client"

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, Users, Copy, Activity, Camera, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ProfilePicture from "@/components/ui/profile-picture";
import OptimizedImage from "@/components/ui/optimized-image";

interface UserProfile {
  user_id: string;
  username: string;
  private_account: boolean;
  profile_picture_url?: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: any[];
  created_at: string;
}

interface SharedWorkout {
  id: string;
  template_name: string;
  total_volume: number;
  duration: string;
  exercises: any[];
  exercise_stats: any[];
  created_at: string;
}

interface Friendship {
  user1_id: string;
  user2_id: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sharedWorkouts, setSharedWorkouts] = useState<SharedWorkout[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFriends, setIsFriends] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [templateToCopy, setTemplateToCopy] = useState<WorkoutTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [copying, setCopying] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followStatus, setFollowStatus] = useState<'none' | 'accepted' | 'pending'>('none');
  const [followId, setFollowId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [progressPictures, setProgressPictures] = useState<any[]>([]);
  const [progressPicturesLoading, setProgressPicturesLoading] = useState(true);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [expandedTemplatesArray, setExpandedTemplatesArray] = useState<string[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedWorkoutsArray, setExpandedWorkoutsArray] = useState<string[]>([]);

  // Fetch followers/following and follow status
  const fetchFollowData = useCallback(async (profileUserId: string) => {
    if (!currentUser) return;
    // Get followers and following
    const res = await fetch(`/api/follow/list?userId=${profileUserId}`);
    const { followers, following, allFollowers, allFollowing } = await res.json();
    setFollowers(followers);
    setFollowing(following);
    // Check if current user follows this profile (use allFollowers for status checking)
    const myFollow = (allFollowers as Array<{follower_id: string, status: string, id: string}>).find((f) => f.follower_id === currentUser.id);
    if (myFollow) {
      // Reset rejected requests to 'none' so user can request again
      if (myFollow.status === 'rejected') {
        setFollowStatus('none');
        setFollowId(null);
      } else {
        setFollowStatus(myFollow.status as 'none' | 'accepted' | 'pending');
        setFollowId(myFollow.id);
      }
    } else {
      setFollowStatus('none');
      setFollowId(null);
    }
    // If viewing own profile and private, show pending requests
    if (profileUserId === currentUser.id && userProfile?.private_account) {
      setPendingRequests((allFollowers as Array<{status: string}>).filter((f) => f.status === 'pending'));
    } else {
      setPendingRequests([]);
    }

    // Reload content with correct privacy settings after follow status is determined
    if (userProfile) {
      const isFriendsWithUser = myFollow?.status === 'accepted';
      loadTemplates(userProfile, isFriendsWithUser);
      loadSharedWorkouts(userProfile.user_id, userProfile.private_account, isFriendsWithUser);
      loadProgressPictures(userProfile, isFriendsWithUser);
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    const initialize = async () => {
      await getCurrentUser();
      await loadUserProfile();
    };
    initialize();
  }, [username]);

  // Reload templates when current user changes (for friendship check)
  useEffect(() => {
    if (currentUser && userProfile) {
      const reloadData = async () => {
        await fetchFollowData(userProfile.user_id);
      };
      reloadData();
    }
  }, [currentUser, userProfile, fetchFollowData]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile by username
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, username, private_account, profile_picture_url')
        .eq('username', username)
        .single();

      if (profileError) {
        setError('User not found');
        return;
      }

      setUserProfile(profile);

      // Load all data in parallel for better performance
      const loadDataPromises = [];
      
      // Always load templates and workouts (they'll be filtered based on privacy later)
      loadDataPromises.push(
        loadTemplates(profile, false),
        loadSharedWorkouts(profile.user_id, profile.private_account, false),
        loadProgressPictures(profile, false)
      );

      // If current user exists, also load follow data
      if (currentUser) {
        loadDataPromises.push(fetchFollowData(profile.user_id));
      }

      await Promise.all(loadDataPromises);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadSharedWorkouts = async (userId: string, privateAccount: boolean, isFriendsWithUser: boolean) => {
    try {
      // If private_account is true and not friends or self, do not load workouts
      if (privateAccount && !isFriendsWithUser && currentUser?.id !== userId) {
        setSharedWorkouts([]);
        return;
      }
      // Load shared workouts with limit for better performance
      const { data: workoutsData, error } = await supabase
        .from('shared_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent 20 workouts for performance

      if (error) {
        console.error('Error loading shared workouts:', error);
        return;
      }

      console.log('Shared workouts found:', workoutsData);
      
      // Filter out hidden workouts if viewing another user's profile
      let filteredWorkouts = workoutsData || [];
      if (currentUser?.id !== userId) {
        // Get hidden and deleted workouts for this user
        const { data: userProfileData } = await supabase
          .from('user_profiles')
          .select('hidden_workouts, deleted_workouts')
          .eq('user_id', userId)
          .single();

        if (userProfileData?.hidden_workouts && Array.isArray(userProfileData.hidden_workouts)) {
          const hiddenWorkoutIds = new Set(userProfileData.hidden_workouts);
          filteredWorkouts = filteredWorkouts.filter(workout => !hiddenWorkoutIds.has(workout.id));
          console.log('Filtered out hidden workouts:', hiddenWorkoutIds);
        }

        if (userProfileData?.deleted_workouts && Array.isArray(userProfileData.deleted_workouts)) {
          const deletedWorkoutIds = new Set(userProfileData.deleted_workouts);
          filteredWorkouts = filteredWorkouts.filter(workout => !deletedWorkoutIds.has(workout.id));
          console.log('Filtered out deleted workouts:', deletedWorkoutIds);
        }
      }
      
      setSharedWorkouts(filteredWorkouts);
    } catch (error) {
      console.error('Error loading shared workouts:', error);
    }
  };

  const loadTemplates = async (profile: UserProfile, isFriendsWithUser: boolean) => {
    try {
      console.log('Loading templates for user:', profile.user_id);
      console.log('Is friends:', isFriendsWithUser);
      console.log('Current user ID:', currentUser?.id);
      console.log('Profile user ID:', profile.user_id);
      console.log('Can view templates:', isFriendsWithUser || currentUser?.id === profile.user_id);

      // Load templates with limit for better performance
      const { data: templatesData, error } = await supabase
        .from('workout_templates')
        .select('id, name, exercises, created_at')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent 20 templates for performance

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      console.log('Templates found:', templatesData);
      
      // Filter out hidden templates if viewing another user's profile
      let filteredTemplates = templatesData || [];
      if (currentUser?.id !== profile.user_id) {
        // Get hidden templates for this user
        const { data: userProfileData } = await supabase
          .from('user_profiles')
          .select('hidden_templates')
          .eq('user_id', profile.user_id)
          .single();

        if (userProfileData?.hidden_templates && Array.isArray(userProfileData.hidden_templates)) {
          const hiddenTemplateIds = new Set(userProfileData.hidden_templates);
          filteredTemplates = filteredTemplates.filter(template => !hiddenTemplateIds.has(template.id));
          console.log('Filtered out hidden templates:', hiddenTemplateIds);
        }
      }
      
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadProgressPictures = async (profile: UserProfile, isFriendsWithUser: boolean) => {
    try {
      setProgressPicturesLoading(true);
      
      // Load progress pictures based on privacy settings with limit for better performance
      let query = supabase
        .from('progress_pictures')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent 20 progress pictures for performance

      // If private account and not friends, only show non-hidden pictures
      if (profile.private_account && !isFriendsWithUser) {
        query = query.eq('hidden', false);
      }

      const { data: progressPicturesData, error } = await query;

      if (error) {
        console.error('Error loading progress pictures:', error);
        return;
      }

      // Get user's deleted progress pictures
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('deleted_progress_pictures')
        .eq('user_id', profile.user_id)
        .single();

      const deletedPictures = userProfileData?.deleted_progress_pictures || [];

      // Filter out deleted pictures
      const filteredPictures = (progressPicturesData || []).filter(picture => {
        return !deletedPictures.includes(picture.id);
      });

      setProgressPictures(filteredPictures);
    } catch (error) {
      console.error('Error loading progress pictures:', error);
    } finally {
      setProgressPicturesLoading(false);
    }
  };

  const handleCopyTemplate = (template: WorkoutTemplate) => {
    setTemplateToCopy(template);
    setNewTemplateName(`${template.name} (Copy)`);
    setCopyDialogOpen(true);
  };

  const toggleTemplateExpansion = (templateId: string) => {
    setExpandedTemplatesArray(prev => {
      const newArray = prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      return newArray;
    });
  };

  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkoutsArray(prev => {
      const newArray = prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId];
      return newArray;
    });
  };

  const copyTemplate = async () => {
    if (!templateToCopy || !newTemplateName.trim() || !currentUser || !userProfile) return;

    try {
      setCopying(true);

      // Import the predefined exercise list
      const { EXERCISE_LIST } = await import('@/lib/exercises');
      
      // Get user's existing custom exercises
      const { data: existingCustomExercises, error: customError } = await supabase
        .from('user_custom_exercises')
        .select('exercise_name')
        .eq('user_id', currentUser.id);

      if (customError) {
        console.error('Error fetching custom exercises:', customError);
      }

      const existingCustomNames = existingCustomExercises?.map(ex => ex.exercise_name) || [];
      const allAvailableExercises = [...EXERCISE_LIST, ...existingCustomNames];

      // Find custom exercises in the template that need to be added
      const customExercisesToAdd = templateToCopy.exercises
        .filter((exercise: any) => {
          const exerciseName = exercise.name;
          return !allAvailableExercises.includes(exerciseName);
        })
        .map((exercise: any) => {
          // Try to find the original muscle group for this custom exercise
          // We need to query the original user's custom exercises to get the muscle group
          return {
            exercise_name: exercise.name,
            muscle_group: 'Other' // Will be updated below if we can find the original
          };
        });

      // Get the original muscle groups for custom exercises
      if (customExercisesToAdd.length > 0) {
        try {
          // Get the original user's custom exercises to find the muscle groups
          const { data: originalCustomExercises, error: originalError } = await supabase
            .from('user_custom_exercises')
            .select('exercise_name, muscle_group')
            .eq('user_id', userProfile.user_id)
            .in('exercise_name', customExercisesToAdd.map(ex => ex.exercise_name));

          if (!originalError && originalCustomExercises) {
            // Update the muscle groups with the original values
            customExercisesToAdd.forEach(customEx => {
              const original = originalCustomExercises.find(orig => orig.exercise_name === customEx.exercise_name);
              if (original) {
                customEx.muscle_group = original.muscle_group;
              }
            });
          }
        } catch (error) {
          console.error('Error fetching original muscle groups:', error);
          // Continue with default "Other" muscle group if this fails
        }
      }

      // Add custom exercises to user's custom exercises
      if (customExercisesToAdd.length > 0) {
        const { error: addCustomError } = await supabase
          .from('user_custom_exercises')
          .insert(customExercisesToAdd.map(exercise => ({
            user_id: currentUser.id,
            exercise_name: exercise.exercise_name,
            muscle_group: exercise.muscle_group
          })));

        if (addCustomError) {
          console.error('Error adding custom exercises:', addCustomError);
          // Continue with template copy even if custom exercises fail
        }
      }

      // Copy the template
      const { data, error } = await supabase
        .from('workout_templates')
        .insert([{
          user_id: currentUser.id,
          name: newTemplateName.trim(),
          exercises: templateToCopy.exercises
        }])
        .select()
        .single();

      if (error) {
        console.error('Error copying template:', error);
        alert('Failed to copy template. Please try again.');
        return;
      }

      setCopyDialogOpen(false);
      setTemplateToCopy(null);
      setNewTemplateName('');
    } catch (error) {
      console.error('Error copying template:', error);
      alert('Failed to copy template. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  // Follow/unfollow/request handlers
  const handleFollow = async () => {
    if (!userProfile) return;
    await fetch('/api/follow/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followedId: userProfile.user_id })
    });
    fetchFollowData(userProfile.user_id);
  };
  const handleUnfollow = async () => {
    if (!userProfile) return;
    await fetch('/api/follow/unfollow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followedId: userProfile.user_id })
    });
    fetchFollowData(userProfile.user_id);
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
        <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The user "{username}" could not be found.
          </p>
          <Link href="/search">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canViewTemplates = userProfile && (!userProfile.private_account || currentUser?.id === userProfile.user_id || followStatus === 'accepted');

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">


      {/* Profile Picture and Info */}
      <div className="flex items-center gap-8 mb-8">
        <ProfilePicture
          pictureUrl={userProfile.profile_picture_url}
          size="xl"
        />
        
        <div className="flex flex-col">
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            @{userProfile.username}
          </div>
          
          <div className="flex gap-6 text-sm text-gray-700 dark:text-gray-300 mb-4">
            <span>{followers.length} Followers</span>
            <span>{following.length} Following</span>
          </div>
          
          {currentUser && currentUser.id !== userProfile.user_id && (
            <div className="mt-2">
              {followStatus === 'none' && (
                <Button 
                  onClick={handleFollow}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full"
                >
                  {userProfile.private_account ? 'Request' : 'Follow'}
                </Button>
              )}
              {followStatus === 'pending' && (
                <Button 
                  disabled
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-8 rounded-full"
                >
                  Requested
                </Button>
              )}
              {followStatus === 'accepted' && (
                <Button 
                  variant="outline" 
                  onClick={handleUnfollow}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 px-8 rounded-full"
                >
                  Unfollow
                </Button>
              )}

            </div>
          )}

        </div>
      </div>



      {/* Templates Section */}
      {templates.length > 0 && canViewTemplates && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex items-center gap-2 mb-6">
            <Dumbbell className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Workout Templates</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
            {templates.map((template) => {
              const isExpanded = expandedTemplatesArray.includes(template.id);
              return (
                <div
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors relative"
                  style={{ height: isExpanded ? 'auto' : '110px' }}
                >
                  {/* Header - Always visible */}
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-start"
                    onClick={() => toggleTemplateExpansion(template.id)}
                  >
                    <div className="flex-1 min-h-0">
                      <h3 className="font-medium line-clamp-2 text-gray-900 dark:text-gray-100">{template.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentUser && currentUser.id !== userProfile.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyTemplate(template);
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="Copy template"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="text-gray-400 dark:text-gray-500">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Exercise List */}
                      <div className="space-y-2 mb-3 mt-3">
                        {template.exercises?.map((exercise: any, index: number) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {exercise.name}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {exercise.sets || 0} sets
                              {exercise.reps && ` × ${exercise.reps} reps`}
                              {exercise.weight && ` @ ${exercise.weight}lbs`}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-2">
                        Created {new Date(template.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logged Workouts Section */}
      {sharedWorkouts.length > 0 && canViewTemplates && (
        <div className="w-full max-w-4xl px-4 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Logged Workouts</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
            {sharedWorkouts.map((workout) => {
              const isExpanded = expandedWorkoutsArray.includes(workout.id);
              return (
                <div
                  key={workout.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors relative"
                  style={{ height: isExpanded ? 'auto' : '200px' }}
                >
                  {/* Header - Always visible */}
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-start"
                    onClick={() => toggleWorkoutExpansion(workout.id)}
                  >
                    <div className="flex-1 min-h-0">
                      <h3 className="font-medium line-clamp-2 text-gray-900 dark:text-gray-100">{workout.template_name}</h3>
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                        {new Date(workout.created_at).toLocaleDateString()} at {new Date(workout.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="text-gray-400 dark:text-gray-500">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  
                  {/* Workout Stats - Always visible */}
                  <div className="px-4 pb-4" style={{ position: isExpanded ? 'static' : 'absolute', bottom: isExpanded ? 'auto' : '16px', left: '16px', right: '16px', top: isExpanded ? 'auto' : '120px' }}>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {workout.total_volume.toLocaleString()}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">lbs</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {workout.duration}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">duration</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Exercise Breakdown */}
                      <div className="space-y-2 mb-3 mt-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercises</h4>
                        {workout.exercise_stats?.map((exercise: any, index: number) => (
                          <div key={index} className="text-xs">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {exercise.name}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {exercise.totalSets} sets • {exercise.totalReps} reps • {exercise.totalWeight} lbs
                            </div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                              Volume: {exercise.volume.toLocaleString()} lbs
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Pictures Section */}
      {progressPictures.length > 0 && canViewTemplates && (
        <div className="w-full max-w-4xl px-4 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Progress Pictures</h2>
          </div>

          {progressPicturesLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading progress pictures...
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {progressPictures.map((picture) => (
                <div
                  key={picture.id}
                  className="relative aspect-square cursor-pointer group"
                  onClick={() => {
                    // Could add a modal to view the picture in detail
                  }}
                >
                  <OptimizedImage 
                    src={picture.image_url} 
                    alt="Progress Picture" 
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 33vw, 300px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show message when templates are private and user can't view them */}
      {!canViewTemplates && currentUser && userProfile && currentUser.id !== userProfile.user_id && (followStatus === 'none' || followStatus === 'pending') && (
        <div className="w-full max-w-4xl px-4">
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Private Account</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This account is private. Follow this user to view their profile.
            </p>
            {followStatus === 'none' && (
              <Button 
                onClick={handleFollow}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Request
              </Button>
            )}
            {followStatus === 'pending' && (
              <Button 
                disabled
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Request Sent
              </Button>
            )}


          </div>
        </div>
      )}



      {/* Copy Template Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle>Copy Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium mb-2">
                Template Name
              </label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="w-full"
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button
                onClick={() => setCopyDialogOpen(false)}
                disabled={copying}
              >
                Cancel
              </Button>
              <Button
                onClick={copyTemplate}
                variant="outline"
                disabled={!newTemplateName.trim() || copying}
              >
                {copying ? 'Copying...' : 'Copy Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 