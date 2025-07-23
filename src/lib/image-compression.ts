import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: string
  quality?: number
}

export const defaultCompressionOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: 'image/webp',
  quality: 0.85
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const compressionOptions = {
    ...defaultCompressionOptions,
    ...options
  }

  try {
    console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
    
    const compressedFile = await imageCompression(file, compressionOptions)
    
    console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')
    console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1), '%')
    
    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    // Return original file if compression fails
    return file
  }
}

export async function compressImageForProfile(
  file: File
): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    quality: 0.9
  })
}

export async function compressImageForProgress(
  file: File
): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    quality: 0.85
  })
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPEG, PNG, or WebP image.'
    }
  }

  // Check file size (max 10MB before compression)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Please upload an image smaller than 10MB.'
    }
  }

  return { valid: true }
} 