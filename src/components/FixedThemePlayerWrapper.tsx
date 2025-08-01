'use client'

import { ReactNode, useEffect } from 'react'
import { usePlayerColors } from '@/hooks/usePlayerColors'

interface FixedThemePlayerWrapperProps {
  children: ReactNode
  className?: string
}

export default function FixedThemePlayerWrapper({ children, className = "" }: FixedThemePlayerWrapperProps) {
  const { setColorTheme, getUIColors } = usePlayerColors()
  
  // Force purple theme and dark mode
  useEffect(() => {
    // Set purple theme
    setColorTheme('purple')
    
    // Force dark mode
    document.documentElement.classList.add('dark')
    
    // Store fixed preferences
    localStorage.setItem('playerColorTheme', 'purple')
    localStorage.setItem('theme', 'dark')
  }, [setColorTheme])

  const { background, shadow, highlight } = getUIColors(true) // Always dark mode

  // Apply theme colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--player-bg', background)
    root.style.setProperty('--player-shadow', shadow)
    root.style.setProperty('--player-highlight', highlight)
  }, [background, shadow, highlight])

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ease-in-out ${className}`}
      style={{ 
        backgroundColor: background,
        '--shadow-color': shadow,
        '--highlight-color': highlight
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}