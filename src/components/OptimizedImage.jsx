import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function OptimizedImage({ src, alt, className, onLoad, ...props }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(null)

  useEffect(() => {
    // Preload image
    const img = new Image()
    img.src = src
    
    img.onload = () => {
      setCurrentSrc(src)
      setLoaded(true)
      if (onLoad) onLoad()
    }
    
    img.onerror = () => {
      setError(true)
      setCurrentSrc('https://via.placeholder.com/600?text=Image+Unavailable')
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, onLoad])

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {!loaded && !error && (
        <div className={`${className} bg-gradient-to-br from-neutral-200 to-neutral-300 animate-pulse`} />
      )}
      
      {/* Actual image */}
      {currentSrc && (
        <motion.img
          src={currentSrc}
          alt={alt}
          className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          {...props}
        />
      )}
    </div>
  )
}
