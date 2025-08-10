"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ProfilePicture from "@/components/ui/profile-picture"
import { Dumbbell, Users, Eye, EyeOff, Activity, Camera, Plus, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import OptimizedImage from "@/components/ui/optimized-image"
import { compressImageForProfile, compressImageForProgress, validateImageFile } from "@/lib/image-compression"

interface WorkoutTemplate {
  id: string
  name: string
  exercises: any[]
  created_at: string
  hidden?: boolean
}

interface SharedWorkout {
  id: string
  template_name: string
  total_volume: number
  duration: string
  exercises: any[]
  exercise_stats: any[]
  created_at: string
}

export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [hiddenTemplates, setHiddenTemplates] = useState<Set<string>>(new Set())
  const [sharedWorkouts, setSharedWorkouts] = useState<SharedWorkout[]>([])
  const [workoutsLoading, setWorkoutsLoading] = useState(true)
  const [hiddenWorkouts, setHiddenWorkouts] = useState<Set<string>>(new Set())
  const [deletedWorkouts, setDeletedWorkouts] = useState<Set<string>>(new Set())
  const [privateAccount, setPrivateAccount] = useState(false)
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [newCaption, setNewCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>('No file chosen')
  const [progressPictures, setProgressPictures] = useState<any[]>([])
  const [progressPicturesLoading, setProgressPicturesLoading] = useState(true)
  const [storageBucketExists, setStorageBucketExists] = useState<boolean | null>(null)
  const [hiddenProgressPictures, setHiddenProgressPictures] = useState<Set<string>>(new Set())
  const [deletedProgressPictures, setDeletedProgressPictures] = useState<Set<string>>(new Set())
  const [selectedProgressPicture, setSelectedProgressPicture] = useState<any>(null)
  const [showProgressPictureModal, setShowProgressPictureModal] = useState(false)
  const [showProgressPictureMenu, setShowProgressPictureMenu] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false)
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [expandedTemplatesArray, setExpandedTemplatesArray] = useState<string[]>([])
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())
  const [expandedWorkoutsArray, setExpandedWorkoutsArray] = useState<string[]>([])

  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 80, height: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(false)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch profile data and all other data in parallel for better performance
          const [profileResponse, templatesResponse, workoutsResponse, followResponse, progressResponse] = await Promise.all([
            supabase
              .from('user_profiles')
              .select('username, profile_picture_url, private_account, hidden_templates, hidden_workouts, deleted_workouts, hidden_progress_pictures, deleted_progress_pictures')
              .eq('user_id', user.id)
              .single(),
            supabase
              .from('workout_templates')
              .select('id, name, exercises, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20), // Limit to recent 20 templates for performance
            supabase
              .from('shared_workouts')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20), // Limit to recent 20 workouts for performance
            fetch(`/api/follow/list?userId=${user.id}`),
            supabase
              .from('progress_pictures')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20) // Limit to recent 20 progress pictures for performance
          ])

          // Handle profile data
          if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileResponse.error)
          } else if (profileResponse.data) {
      
            setUsername(profileResponse.data.username)
            setProfilePictureUrl(profileResponse.data.profile_picture_url)
            setPrivateAccount(profileResponse.data.private_account || false)
            
            // Set hidden/deleted data
            if (profileResponse.data.hidden_templates) {
              setHiddenTemplates(new Set(profileResponse.data.hidden_templates))
            }
            if (profileResponse.data.hidden_workouts) {
              setHiddenWorkouts(new Set(profileResponse.data.hidden_workouts))
            }
            if (profileResponse.data.deleted_workouts) {
              setDeletedWorkouts(new Set(profileResponse.data.deleted_workouts))
            }
            if (profileResponse.data.hidden_progress_pictures) {
              setHiddenProgressPictures(new Set(profileResponse.data.hidden_progress_pictures))
            }
            if (profileResponse.data.deleted_progress_pictures) {
              setDeletedProgressPictures(new Set(profileResponse.data.deleted_progress_pictures))
            }
          }

          // Handle templates data
          if (templatesResponse.error) {
            console.error('Error loading templates:', templatesResponse.error)
          } else {
      
            setTemplates(templatesResponse.data || [])
          }

          // Handle workouts data
          if (workoutsResponse.error) {
            console.error('Error loading shared workouts:', workoutsResponse.error)
          } else {
      
            setSharedWorkouts(workoutsResponse.data || [])
          }

          // Handle follow data
          try {
            const followData = await followResponse.json()
            setFollowers(followData.followers)
            setFollowing(followData.following)
          } catch (error) {
            console.error('Error loading follow data:', error)
          }

          // Handle progress pictures data
          if (progressResponse.error) {
            console.error('Error loading progress pictures:', progressResponse.error)
          } else {
      
            setProgressPictures(progressResponse.data || [])
          }

          // Check storage bucket (this can be done separately as it's not critical for initial load)
          checkStorageBucket()
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
        setTemplatesLoading(false)
        setWorkoutsLoading(false)
        setProgressPicturesLoading(false)
      }
    }
    fetchUser()
  }, [])

  const loadTemplates = async (userId: string) => {
    try {
      setTemplatesLoading(true)
      
      // Load templates
      const { data: templatesData, error } = await supabase
        .from('workout_templates')
        .select('id, name, exercises, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading templates:', error)
        return
      }


      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const loadHiddenTemplates = async (userId: string) => {
    try {
      // Load hidden templates from user_profiles
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('hidden_templates, hidden_workouts, deleted_workouts, hidden_progress_pictures, deleted_progress_pictures')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading hidden templates:', error)
        return
      }

      if (profile?.hidden_templates) {
        setHiddenTemplates(new Set(profile.hidden_templates))
      }

      if (profile?.hidden_workouts) {
        setHiddenWorkouts(new Set(profile.hidden_workouts))
      }

      if (profile?.deleted_workouts) {
        setDeletedWorkouts(new Set(profile.deleted_workouts))
      }

      if (profile?.hidden_progress_pictures) {
        setHiddenProgressPictures(new Set(profile.hidden_progress_pictures))
      }

      if (profile?.deleted_progress_pictures) {
        setDeletedProgressPictures(new Set(profile.deleted_progress_pictures))
      }
    } catch (error) {
      console.error('Error loading hidden templates:', error)
    }
  }

  const loadSharedWorkouts = async (userId: string) => {
    try {
      setWorkoutsLoading(true)
      
      // Load shared workouts
      const { data: workoutsData, error } = await supabase
        .from('shared_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading shared workouts:', error)
        return
      }


      setSharedWorkouts(workoutsData || [])
    } catch (error) {
      console.error('Error loading shared workouts:', error)
    } finally {
      setWorkoutsLoading(false)
    }
  }

  const loadFollowData = async (userId: string) => {
    try {
      const res = await fetch(`/api/follow/list?userId=${userId}`)
      const { followers, following } = await res.json()
      setFollowers(followers)
      setFollowing(following)
    } catch (error) {
      console.error('Error loading follow data:', error)
    }
  }

  const loadProgressPictures = async (userId: string) => {
    try {
      setProgressPicturesLoading(true)
      const { data: progressPicturesData, error } = await supabase
        .from('progress_pictures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading progress pictures:', error)
        return
      }


      setProgressPictures(progressPicturesData || [])
    } catch (error) {
      console.error('Error loading progress pictures:', error)
    } finally {
      setProgressPicturesLoading(false)
    }
  }

  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.from('progress-pictures').list()
      if (error) {
        console.error('Error checking storage bucket:', error)
        setStorageBucketExists(false)
      } else {
        setStorageBucketExists(true)
      }
    } catch (error) {
      console.error('Error checking storage bucket:', error)
      setStorageBucketExists(false)
    }
  }

  const hideProgressPicture = async (pictureId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newHiddenPictures = new Set(hiddenProgressPictures)
      if (newHiddenPictures.has(pictureId)) {
        newHiddenPictures.delete(pictureId)
      } else {
        newHiddenPictures.add(pictureId)
      }

      setHiddenProgressPictures(newHiddenPictures)

      // Update the hidden_progress_pictures field in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          hidden_progress_pictures: Array.from(newHiddenPictures)
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating hidden progress pictures:', error)
        // Revert the state if update failed
        setHiddenProgressPictures(hiddenProgressPictures)
      }
    } catch (error) {
      console.error('Error hiding progress picture:', error)
      // Revert the state if update failed
      setHiddenProgressPictures(hiddenProgressPictures)
    }
  }

  const deleteProgressPicture = async (pictureId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newDeletedPictures = new Set(deletedProgressPictures)
      newDeletedPictures.add(pictureId)
      setDeletedProgressPictures(newDeletedPictures)

      // Update the deleted_progress_pictures field in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          deleted_progress_pictures: Array.from(newDeletedPictures)
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting progress picture:', error)
        // Revert the state if update failed
        setDeletedProgressPictures(deletedProgressPictures)
      }
    } catch (error) {
      console.error('Error deleting progress picture:', error)
      // Revert the state if update failed
      setDeletedProgressPictures(deletedProgressPictures)
    }
  }

  const handleUploadProgressPicture = async () => {
    if (!selectedFile || !newCaption.trim()) return
    
    try {
      setUploading(true)
      setUploadError(null) // Clear previous errors
      
      // Upload file to Supabase storage
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUploadError('User not logged in.')
        setUploading(false)
        return
      }
      
      let imageUrl = ''
      
      try {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('progress-pictures')
          .upload(fileName, selectedFile)
        
        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          // Convert file to data URL as fallback with crop
          const reader = new FileReader()
          imageUrl = await new Promise((resolve) => {
            reader.onload = () => {
              const img = new Image()
              img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                canvas.width = 400
                canvas.height = 400
                
                // Calculate crop dimensions based on cropArea percentages
                const cropSize = Math.min(img.width, img.height) * (cropArea.width / 100)
                const centerX = (cropArea.x / 100) * img.width
                const centerY = (cropArea.y / 100) * img.height
                const cropX = Math.max(0, centerX - cropSize / 2)
                const cropY = Math.max(0, centerY - cropSize / 2)
                
                ctx?.drawImage(
                  img,
                  cropX, cropY, cropSize, cropSize,
                  0, 0, 400, 400
                )
                
                resolve(canvas.toDataURL('image/jpeg', 0.8))
              }
              img.src = reader.result as string
            }
            reader.readAsDataURL(selectedFile)
          })
        } else {
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('progress-pictures')
            .getPublicUrl(fileName)
          
          if (!publicUrl) {
            setUploadError('Could not get public URL for the uploaded file.')
            setUploading(false)
            return
          }
          
          imageUrl = publicUrl
        }
      } catch (storageError) {
        console.error('Storage error, using fallback:', storageError)
        // Convert file to data URL as fallback with crop
        const reader = new FileReader()
        imageUrl = await new Promise((resolve) => {
          reader.onload = () => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = 400
              canvas.height = 400
              
              // Calculate crop dimensions based on cropArea percentages
              const cropSize = Math.min(img.width, img.height) * (cropArea.width / 100)
              const centerX = (cropArea.x / 100) * img.width
              const centerY = (cropArea.y / 100) * img.height
              const cropX = Math.max(0, centerX - cropSize / 2)
              const cropY = Math.max(0, centerY - cropSize / 2)
              
              ctx?.drawImage(
                img,
                cropX, cropY, cropSize, cropSize,
                0, 0, 400, 400
              )
              
              resolve(canvas.toDataURL('image/jpeg', 0.8))
            }
            img.src = reader.result as string
          }
          reader.readAsDataURL(selectedFile)
        })
      }
      
      // Save to database
      const response = await fetch('/api/profile/upload-progress-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, caption: newCaption })
      })
      
      if (response.ok) {
        setShowUploadDialog(false)
        setNewCaption('')
        setSelectedFile(null)
        setPreviewUrl(null)
        setSelectedFileName('No file chosen')
        setUploadError(null)
        // Refresh the progress pictures
        await loadProgressPictures(user.id)
      } else {
        console.error('Failed to upload progress picture')
        setUploadError('Failed to save progress picture to database.')
      }
    } catch (error) {
      console.error('Error uploading progress picture:', error)
      setUploadError('An unexpected error occurred during upload.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file')
        return
      }

      try {
        // Compress the image
        const compressedFile = await compressImageForProgress(file)
        setSelectedFile(compressedFile)
        setSelectedFileName(compressedFile.name)
        const url = URL.createObjectURL(compressedFile)
        setPreviewUrl(url)
        // Reset crop area to center
        setCropArea({ x: 50, y: 50, width: 80, height: 80 })
        setUploadError(null)
      } catch (error) {
        console.error('Error compressing image:', error)
        setUploadError('Failed to process image. Please try again.')
      }
    } else {
      setSelectedFileName('No file chosen')
    }
  }

  const hideWorkout = async (workoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newHiddenWorkouts = new Set(hiddenWorkouts)
      if (newHiddenWorkouts.has(workoutId)) {
        newHiddenWorkouts.delete(workoutId)
      } else {
        newHiddenWorkouts.add(workoutId)
      }

      setHiddenWorkouts(newHiddenWorkouts)

      // Update the hidden_workouts field in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          hidden_workouts: Array.from(newHiddenWorkouts)
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating hidden workouts:', error)
        // Revert the state if update failed
        setHiddenWorkouts(hiddenWorkouts)
      }
    } catch (error) {
      console.error('Error hiding workout:', error)
      // Revert the state if update failed
      setHiddenWorkouts(hiddenWorkouts)
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newDeletedWorkouts = new Set(deletedWorkouts)
      newDeletedWorkouts.add(workoutId)
      setDeletedWorkouts(newDeletedWorkouts)

      // Update the deleted_workouts field in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          deleted_workouts: Array.from(newDeletedWorkouts)
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting workout:', error)
        // Revert the state if update failed
        setDeletedWorkouts(deletedWorkouts)
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
      // Revert the state if update failed
      setDeletedWorkouts(deletedWorkouts)
    }
  }

  const toggleTemplateExpansion = (templateId: string) => {
    setExpandedTemplatesArray(prev => {
      const newArray = prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      return newArray;
    });
  };

  const toggleTemplateVisibility = async (templateId: string) => {
    try {
      const newHiddenTemplates = new Set(hiddenTemplates)
      if (newHiddenTemplates.has(templateId)) {
        newHiddenTemplates.delete(templateId)
      } else {
        newHiddenTemplates.add(templateId)
      }
      setHiddenTemplates(newHiddenTemplates)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_profiles')
        .update({ hidden_templates: Array.from(newHiddenTemplates) })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating hidden templates:', error)
        // Revert the state if update failed
        setHiddenTemplates(hiddenTemplates)
      }
    } catch (error) {
      console.error('Error toggling template visibility:', error)
      // Revert the state if update failed
      setHiddenTemplates(hiddenTemplates)
    }
  }

  const toggleWorkoutExpansion = (workoutId: string) => {
    setExpandedWorkoutsArray(prev => {
      const newArray = prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId];
      return newArray;
    });
  };

  const handleProfilePictureFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error || 'Invalid file')
        return
      }

      try {
        // Compress the image
        const compressedFile = await compressImageForProfile(file)
        setProfilePictureFile(compressedFile)
        
        const reader = new FileReader()
        reader.onload = (e) => {
          setProfilePicturePreview(e.target?.result as string)
        }
        reader.readAsDataURL(compressedFile)
        setShowProfilePictureUpload(true)
      } catch (error) {
        console.error('Error compressing image:', error)
        alert('Failed to process image. Please try again.')
      }
    }
  }

  const handleProfilePictureUpload = async () => {
    if (!profilePictureFile) return

    setUploadingProfilePicture(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

  

      // Upload to storage
      const fileExt = profilePictureFile.name.split('.').pop()
      const fileName = `${user.id}/profile-picture.${fileExt}`
      

      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, profilePictureFile, {
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }



      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)



      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }



      // Update local state
      setProfilePictureUrl(publicUrl)
      setShowProfilePictureUpload(false)
      setProfilePictureFile(null)
      setProfilePicturePreview(null)
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert(`Failed to upload profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingProfilePicture(false)
    }
  }

  return (
    <div className="flex flex-col items-center pt-16 min-h-screen bg-white dark:bg-black pb-8">
      {/* Profile Picture and Info */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group">
          <ProfilePicture
            pictureUrl={profilePictureUrl}
            size="xl"
            onClick={() => document.getElementById('profile-picture-input')?.click()}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center pointer-events-none">
            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
        <input
          id="profile-picture-input"
          type="file"
          accept="image/*"
          onChange={handleProfilePictureFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col">
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : username ? (
              `@${username}`
            ) : (
              <span className="text-gray-400">No username set</span>
            )}
          </div>
          
          <div className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
            <span>{followers.length} Followers</span>
            <span>{following.length} Following</span>
          </div>
        </div>
      </div>



      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="w-full max-w-4xl px-4">
          <div className="flex items-center gap-2 mb-6">
            <Dumbbell className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Workout Templates</h2>
          </div>

          {templatesLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading templates...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
              {templates.map((template) => {
                const isHidden = hiddenTemplates.has(template.id)
                const isExpanded = expandedTemplatesArray.includes(template.id)
                return (
                  <div
                    key={template.id}
                    className={`border rounded-lg transition-colors relative ${
                      isHidden 
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 pink:bg-pink-50' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 pink:bg-pink-50 pink:border-pink-200 pink:hover:border-pink-300'
                    }`}
                    style={{ height: isExpanded ? 'auto' : '110px' }}
                  >
                                          {/* Header - Always visible */}
                      <div 
                        className="p-4 cursor-pointer flex justify-between items-start"
                        onClick={() => toggleTemplateExpansion(template.id)}
                      >
                        <div className="flex-1 min-h-0">
                          <h3 className={`font-medium line-clamp-2 ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {template.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTemplateVisibility(template.id);
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title={isHidden ? "Show template" : "Hide template"}
                        >
                          {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
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
                              <div className={`font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                {exercise.name}
                              </div>
                              <div className={`${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                {exercise.sets || 0} sets
                                {exercise.reps && ` × ${exercise.reps} reps`}
                                {exercise.weight && ` @ ${exercise.weight}lbs`}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <p className={`text-xs border-t pt-2 ${
                          isHidden 
                            ? 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600' 
                            : 'text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                        }`}>
                          Created {new Date(template.created_at).toLocaleDateString()}
                          {isHidden && <span className="ml-2">(Hidden)</span>}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Logged Workouts Section */}
      {sharedWorkouts.filter(workout => !deletedWorkouts.has(workout.id)).length > 0 && (
        <div className="w-full max-w-4xl px-4 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Logged Workouts</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
            {sharedWorkouts
              .filter(workout => !deletedWorkouts.has(workout.id))
              .map((workout) => {
                const isHidden = hiddenWorkouts.has(workout.id)
                const isExpanded = expandedWorkoutsArray.includes(workout.id)
                return (
                <div
                  key={workout.id}
                  className={`border rounded-lg transition-colors relative ${
                    isHidden 
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 pink:bg-pink-50' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 pink:bg-pink-50 pink:border-pink-200 pink:hover:border-pink-300'
                  }`}
                  style={{ height: isExpanded ? 'auto' : '200px' }}
                >
                  {/* Header - Always visible */}
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-start"
                    onClick={() => toggleWorkoutExpansion(workout.id)}
                  >
                    <div className="flex-1 min-h-0">
                      <h3 className={`font-medium line-clamp-2 ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {workout.template_name}
                      </h3>
                      <p className={`text-xs mt-1 ${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-500'}`}>
                        {new Date(workout.created_at).toLocaleDateString()} at {new Date(workout.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedWorkout(workout)
                          setShowWorkoutMenu(true)
                        }}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="More options"
                      >
                        ⋯
                      </Button>
                      <div className="text-gray-400 dark:text-gray-500">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Workout Stats - Always visible */}
                  <div className="px-4 pb-4" style={{ position: isExpanded ? 'static' : 'absolute', bottom: isExpanded ? 'auto' : '16px', left: '16px', right: '16px', top: isExpanded ? 'auto' : '120px' }}>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 pink:bg-pink-100 rounded">
                        <div className={`font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {workout.total_volume.toLocaleString()}
                        </div>
                        <div className={`${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>lbs</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 pink:bg-pink-100 rounded">
                        <div className={`font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {workout.duration}
                        </div>
                        <div className={`${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>duration</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                      {/* Exercise Breakdown */}
                      <div className="space-y-2 mb-3 mt-3">
                        <h4 className={`text-sm font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>Exercises</h4>
                        {workout.exercise_stats?.map((exercise: any, index: number) => (
                          <div key={index} className="text-xs">
                            <div className={`font-medium ${isHidden ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {exercise.name}
                            </div>
                            <div className={`${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
                              {exercise.totalSets} sets • {exercise.totalReps} reps • {Math.round(exercise.totalWeight / exercise.totalSets)} lbs
                            </div>
                            <div className={`font-medium ${isHidden ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>
                              Volume: {exercise.volume.toLocaleString()} lbs
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <p className={`text-xs border-t pt-2 ${
                        isHidden 
                          ? 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600' 
                          : 'text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                      }`}>
                        {isHidden && <span className="mr-2">(Hidden)</span>}
                      </p>
                    </div>
                  )}
                </div>
              )})}
          </div>
        </div>
      )}

      {/* Progress Pictures Section */}
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
            {/* Post Button Square */}
            <div
              className="relative aspect-square cursor-pointer group bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setShowUploadDialog(true)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            
            {progressPictures
              .filter(picture => !deletedProgressPictures.has(picture.id))
              .map((picture) => {
                const isHidden = hiddenProgressPictures.has(picture.id)
                return (
                  <div
                    key={picture.id}
                    className={`relative aspect-square cursor-pointer group ${
                      isHidden ? 'opacity-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedProgressPicture(picture)
                      setShowProgressPictureModal(true)
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
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProgressPicture(picture)
                          setShowProgressPictureMenu(true)
                        }}
                        className="h-8 w-8 p-0 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-transparent dark:hover:bg-transparent"
                        title="More options"
                      >
                        ⋯
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Upload Progress Picture Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md w-[90vw] mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle>Post Progress Picture</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a progress picture to share with your followers.
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="progress-picture" className="block text-sm font-medium mb-2">
                Progress Picture
              </label>
              <div className="flex justify-center">
                <label htmlFor="progress-picture" className="w-full max-w-xs bg-gray-800 border border-gray-600 rounded-lg cursor-pointer flex items-center">
                  <span className="bg-gray-600 text-white px-4 py-2 rounded-l-lg text-sm font-medium flex items-center justify-center min-w-[120px]">
                    Choose File
                  </span>
                  <span className="flex-1 px-4 py-2 text-gray-300 text-sm">
                    {selectedFileName}
                  </span>
                </label>
                <input
                  type="file"
                  id="progress-picture"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {previewUrl && (
                <div className="mt-4">
                  <div className="relative w-64 h-64 mx-auto border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Progress Picture Preview" 
                      className="w-full h-full object-cover"
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    {/* Clear crop box */}
                    <div 
                      className="absolute border-2 border-white shadow-lg cursor-move"
                      style={{
                        left: `${cropArea.x}%`,
                        top: `${cropArea.y}%`,
                        width: `${cropArea.width}%`,
                        height: `${cropArea.height}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setIsDragging(true)
                        setDragStart({ x: e.clientX, y: e.clientY })
                      }}
                    ></div>
                    {/* Crop area indicator */}
                    <div 
                      className="absolute inset-0 cursor-move"
                      onMouseDown={(e) => {
                        setIsDragging(true)
                        setDragStart({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={(e) => {
                        if (isDragging) {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const deltaX = e.clientX - dragStart.x
                          const deltaY = e.clientY - dragStart.y
                          
                          setCropArea(prev => ({
                            ...prev,
                            x: Math.max(10, Math.min(90, prev.x + (deltaX / rect.width) * 100)),
                            y: Math.max(10, Math.min(90, prev.y + (deltaY / rect.height) * 100))
                          }))
                          setDragStart({ x: e.clientX, y: e.clientY })
                        }
                      }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Drag the white box to adjust crop area
                  </p>
                </div>
              )}
              {uploadError && (
                <div className="mt-4 text-red-500 text-sm">
                  {uploadError}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="caption" className="block text-sm font-medium mb-2">
                Caption
              </label>
              <Input
                id="caption"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full"
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button
                onClick={() => {
                  setShowUploadDialog(false)
                  setSelectedFile(null)
                  setPreviewUrl(null)
                  setNewCaption('')
                  setSelectedFileName('No file chosen')
                  setUploadError(null) // Clear error on cancel
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadProgressPicture}
                variant="outline"
                disabled={!newCaption.trim() || uploading || !selectedFile}
              >
                {uploading ? 'Posting...' : 'Post Picture'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Picture Detail Modal */}
      <Dialog open={showProgressPictureModal} onOpenChange={setShowProgressPictureModal}>
        <DialogContent className="max-w-2xl w-[90vw] mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg p-0">
          {selectedProgressPicture && (
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="flex-1">
                <OptimizedImage 
                  src={selectedProgressPicture.image_url} 
                  alt="Progress Picture" 
                  width={600}
                  height={600}
                  className="w-full h-auto max-h-96 md:max-h-none md:h-full object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
              
              {/* Details */}
              <div className="flex-1 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <ProfilePicture userId={selectedProgressPicture.user_id} size="sm" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      @{username}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(selectedProgressPicture.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {selectedProgressPicture.caption && (
                  <div className="mb-4">
                    <p className="text-gray-900 dark:text-gray-100">
                      {selectedProgressPicture.caption}
                    </p>
                  </div>
                )}
                
                <div className="mt-auto flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => hideProgressPicture(selectedProgressPicture.id)}
                    className="flex-1"
                  >
                    {hiddenProgressPictures.has(selectedProgressPicture.id) ? 'Show' : 'Hide'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => deleteProgressPicture(selectedProgressPicture.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Picture Menu */}
      <Dialog open={showProgressPictureMenu} onOpenChange={setShowProgressPictureMenu}>
        <DialogContent className="max-w-sm w-[90vw] mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle>Progress Picture Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedProgressPicture) {
                  hideProgressPicture(selectedProgressPicture.id)
                }
                setShowProgressPictureMenu(false)
              }}
              className="w-full justify-start"
            >
              {selectedProgressPicture && hiddenProgressPictures.has(selectedProgressPicture.id) ? 'Show Picture' : 'Hide Picture'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedProgressPicture) {
                  deleteProgressPicture(selectedProgressPicture.id)
                }
                setShowProgressPictureMenu(false)
              }}
              className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete Picture
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout Menu */}
      <Dialog open={showWorkoutMenu} onOpenChange={setShowWorkoutMenu}>
        <DialogContent className="max-w-sm w-[90vw] mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle>Workout Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedWorkout) {
                  hideWorkout(selectedWorkout.id)
                }
                setShowWorkoutMenu(false)
              }}
              className="w-full justify-start"
            >
              {selectedWorkout && hiddenWorkouts.has(selectedWorkout.id) ? 'Show Workout' : 'Hide Workout'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedWorkout) {
                  deleteWorkout(selectedWorkout.id)
                }
                setShowWorkoutMenu(false)
              }}
              className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Upload Dialog */}
      <Dialog open={showProfilePictureUpload} onOpenChange={setShowProfilePictureUpload}>
        <DialogContent className="max-w-md w-[90vw] mx-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {profilePicturePreview && (
              <div className="flex justify-center">
                <OptimizedImage
                  src={profilePicturePreview}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded-full border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProfilePictureUpload(false)
                  setProfilePictureFile(null)
                  setProfilePicturePreview(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProfilePictureUpload}
                disabled={uploadingProfilePicture || !profilePictureFile}
                className="flex-1"
              >
                {uploadingProfilePicture ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
