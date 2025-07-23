"use client"
import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, X, User } from 'lucide-react'
import OptimizedImage from '@/components/ui/optimized-image'

interface ProfilePictureUploadProps {
  currentPictureUrl: string | null
  onPictureUpdate: (url: string | null) => void
  isOpen: boolean
  onClose: () => void
}

export default function ProfilePictureUpload({
  currentPictureUrl,
  onPictureUpdate,
  isOpen,
  onClose
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('File selected:', file)
    if (!file) {
      console.log('No file selected')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      console.log('Sending upload request...')
      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        onPictureUpdate(data.url)
        handleClose()
      } else {
        console.error('Upload failed:', data)
        setError(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    setError(null)
    try {
      const response = await fetch('/api/profile/upload-picture', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        onPictureUpdate(null)
        handleClose()
      } else {
        setError(data.error || 'Failed to reset profile picture')
      }
    } catch (error) {
      console.error('Reset error:', error)
      setError('Failed to reset profile picture')
    } finally {
      setResetting(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                {currentPictureUrl ? (
                  <OptimizedImage
                    src={currentPictureUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUploadClick}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload New Picture'}
              </Button>

              {currentPictureUrl && (
                <Button
                  onClick={handleReset}
                  disabled={resetting}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <X className="w-4 h-4" />
                  {resetting ? 'Resetting...' : 'Reset to Default'}
                </Button>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-950 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Supported formats: JPEG, PNG, WebP (max 5MB)
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  )
} 