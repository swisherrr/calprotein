"use client"

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, Users, Copy } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ProfilePicture from "@/components/ui/profile-picture";

interface UserProfile {
  user_id: string;
  username: string;
  templates_private: boolean;
  profile_picture_url?: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: any[];
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFriends, setIsFriends] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [templateToCopy, setTemplateToCopy] = useState<WorkoutTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [copying, setCopying] = useState(false);

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
        const isFriendsWithUser = await checkFriendshipStatus(userProfile.user_id);
        await loadTemplates(userProfile, isFriendsWithUser);
      };
      reloadData();
    }
  }, [currentUser, userProfile]);

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
        .select('user_id, username, templates_private, profile_picture_url')
        .eq('username', username)
        .single();

      if (profileError) {
        setError('User not found');
        return;
      }

      setUserProfile(profile);

      // Wait for current user to be loaded, then check friendship status
      if (currentUser) {
        const isFriendsWithUser = await checkFriendshipStatus(profile.user_id);
        // Load templates after friendship check with the correct friendship status
        await loadTemplates(profile, isFriendsWithUser);
      } else {
        // If no current user (not logged in), just load templates
        await loadTemplates(profile, false);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async (userId: string) => {
    try {
      console.log('Checking friendship between:', currentUser.id, 'and', userId);
      
      const { data: friendship, error } = await supabase
        .from('friendships')
        .select('user1_id, user2_id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUser.id})`)
        .single();

      console.log('Friendship found:', friendship);
      const isFriendsWithUser = !!friendship;
      setIsFriends(isFriendsWithUser);
      return isFriendsWithUser;
    } catch (error) {
      console.log('No friendship found or error:', error);
      setIsFriends(false);
      return false;
    }
  };

  const loadTemplates = async (profile: UserProfile, isFriendsWithUser: boolean) => {
    try {
      console.log('Loading templates for user:', profile.user_id);
      console.log('Templates private:', profile.templates_private);
      console.log('Is friends:', isFriendsWithUser);
      console.log('Current user ID:', currentUser?.id);
      console.log('Profile user ID:', profile.user_id);
      console.log('Can view templates:', !profile.templates_private || isFriendsWithUser || currentUser?.id === profile.user_id);

      // If templates are private and user is not friends, don't load templates
      if (profile.templates_private && !isFriendsWithUser && currentUser?.id !== profile.user_id) {
        console.log('Templates are private and user is not friends, not loading templates');
        setTemplates([]);
        return;
      }

      // Load templates
      const { data: templatesData, error } = await supabase
        .from('workout_templates')
        .select('id, name, exercises, created_at')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading templates:', error);
        return;
      }

      console.log('Templates found:', templatesData);
      
      // Also check if there are any templates at all for this user
      const { count } = await supabase
        .from('workout_templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id);
      
      console.log('Total templates count for user:', count);
      
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCopyTemplate = (template: WorkoutTemplate) => {
    setTemplateToCopy(template);
    setNewTemplateName(`${template.name} (Copy)`);
    setCopyDialogOpen(true);
  };

  const copyTemplate = async () => {
    if (!templateToCopy || !newTemplateName.trim() || !currentUser) return;

    try {
      setCopying(true);

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
          <Link href="/friends">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Friends
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canViewTemplates = !userProfile.templates_private || isFriends || currentUser?.id === userProfile.user_id;

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black">
      {/* Back Button */}
      <div className="w-full max-w-4xl px-4 mb-8">
        <Link href="/friends" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Friends
        </Link>
      </div>

      {/* Profile Picture */}
      <div className="mb-6">
        <ProfilePicture
          pictureUrl={userProfile.profile_picture_url}
          size="xl"
        />
      </div>
      
      {/* Username */}
      <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        @{userProfile.username}
      </div>

      {/* Privacy Status */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {userProfile.templates_private ? 'Private Profile' : 'Public Profile'}
      </div>

      {/* Templates Section */}
      <div className="w-full max-w-4xl px-4">
        <div className="flex items-center gap-2 mb-6">
          <Dumbbell className="h-5 w-5" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Workout Templates</h2>
        </div>

        {!canViewTemplates ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Private Templates</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This user's templates are private. Send them a friend request to view their templates.
            </p>
            <Link href="/friends">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Users className="h-4 w-4 mr-2" />
                Send Friend Request
              </Button>
            </Link>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No workout templates found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{template.name}</h3>
                  {currentUser && currentUser.id !== userProfile.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Copy template"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Exercise List */}
                <div className="space-y-2 mb-3">
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
            ))}
          </div>
        )}
      </div>

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