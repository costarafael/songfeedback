'use client'

import { ReactNode, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { usePlayerColors } from '@/hooks/usePlayerColors'

interface ThemedPlayerWrapperProps {
  children: ReactNode
  className?: string
}

export default function ThemedPlayerWrapper({ children, className = "" }: ThemedPlayerWrapperProps) {
  const isDark = useTheme()
  const { getUIColors, colorTheme } = usePlayerColors()
  const { background, shadow, highlight } = getUIColors(isDark)

  // Apply theme colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--player-bg', background)
    root.style.setProperty('--player-shadow', shadow)
    root.style.setProperty('--player-highlight', highlight)
  }, [background, shadow, highlight, colorTheme, isDark])

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