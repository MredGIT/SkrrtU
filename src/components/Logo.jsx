import React from 'react'

export default function Logo({ size = 'md', variant = 'gradient', className = '' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  const variants = {
    gradient: 'bg-gradient-to-r from-primary-500 via-pink-500 to-orange-400 bg-clip-text text-transparent',
    solid: 'text-primary-500',
    white: 'text-white',
    dark: 'text-neutral-900'
  }

  return (
    <h1 className={`font-black tracking-tight ${sizes[size]} ${variants[variant]} ${className}`}>
      SkrrtU
    </h1>
  )
}
