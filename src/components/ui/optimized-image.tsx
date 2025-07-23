import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  sizes?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  sizes,
  onClick,
  style
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Handle local images (from public directory)
  const isLocalImage = src.startsWith('/') && !src.startsWith('//')

  // For local images, try to use optimized WebP version first
  const getOptimizedSrc = (originalSrc: string) => {
    if (!isLocalImage) return originalSrc
    // If it's already a WebP file, use as is
    if (originalSrc.endsWith('.webp')) return originalSrc
    // Try to use optimized version from /optimized directory
    const optimizedPath = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    return optimizedPath
  }

  const optimizedSrc = getOptimizedSrc(src)

  // Fallback to native <img> for remote images
  if (!isLocalImage) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        loading={priority ? 'eager' : 'lazy'}
        onClick={onClick}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
      />
    )
  }

  // Use Next.js <Image> for local images
  return (
    <Image
      src={error ? src : optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${loading ? 'animate-pulse bg-gray-200 dark:bg-gray-700' : ''} ${className}`}
      priority={priority}
      quality={quality}
      sizes={sizes}
      onClick={onClick}
      style={style}
      onLoad={() => setLoading(false)}
      onError={() => {
        setError(true)
        setLoading(false)
      }}
    />
  )
} 