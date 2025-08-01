'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type PlayerColorTheme = 'blue' | 'purple'

interface PlayerColors {
  // WaveSurfer colors
  unplayedLight: string
  unplayedDark: string
  playedLight: string
  playedDark: string
  
  // UI colors
  backgroundLight: string
  backgroundDark: string
  accentLight: string
  accentDark: string
  
  // Text colors
  textPrimaryLight: string
  textPrimaryDark: string
  textSecondaryLight: string
  textSecondaryDark: string
  
  // Neumorphic shadows
  shadowLight: string
  shadowDark: string
  highlightLight: string
  highlightDark: string
}

const colorSchemes: Record<PlayerColorTheme, PlayerColors> = {
  blue: {
    // WaveSurfer
    unplayedLight: '#94a3b8', // slate-400
    unplayedDark: '#475569',  // slate-600
    playedLight: '#3b82f6',   // blue-500
    playedDark: '#60a5fa',    // blue-400
    
    // UI backgrounds (current gray-50/slate system)
    backgroundLight: '#f1f5f9', // slate-100 (mais vivo)
    backgroundDark: '#0f172a',  // slate-900
    accentLight: '#e2e8f0',    // slate-200
    accentDark: '#334155',     // slate-700
    
    // Text colors
    textPrimaryLight: '#1e293b',   // slate-800
    textPrimaryDark: '#f1f5f9',    // slate-100
    textSecondaryLight: '#64748b', // slate-500
    textSecondaryDark: '#cbd5e1',  // slate-300
    
    // Neumorphic shadows (enhanced)
    shadowLight: '#64748b40',     // slate-500 shadow mais visível
    shadowDark: '#00000060',      // black shadow mais forte
    highlightLight: '#ffffff80',  // white highlight mais forte
    highlightDark: '#ffffff20'    // dimmed white highlight mais visível
  },
  purple: {
    // WaveSurfer
    unplayedLight: '#c4b5fd', // violet-300 (mais claro e visível)
    unplayedDark: '#5b21b6',  // violet-800 (mais escuro para contraste)
    playedLight: '#7c3aed',   // violet-600 (mais vibrante)
    playedDark: '#8b5cf6',    // violet-500
    
    // UI backgrounds (purple mais contrastante)
    backgroundLight: '#f5f3ff', // violet-50 intensificado
    backgroundDark: '#1e1b3a',  // purple escuro mais profundo
    accentLight: '#c4b5fd',    // violet-300 mais vibrante
    accentDark: '#6d28d9',     // violet-700 mais intenso
    
    // Text colors
    textPrimaryLight: '#4c1d95',   // violet-900
    textPrimaryDark: '#f5f3ff',    // violet-50
    textSecondaryLight: '#7c3aed', // violet-600
    textSecondaryDark: '#c4b5fd',  // violet-300
    
    // Neumorphic shadows (purple muito mais visível)
    shadowLight: '#7c3aed70',     // violet-600 shadow bem visível
    shadowDark: '#5b21b680',      // violet-800 shadow muito forte
    highlightLight: '#ffffff90',  // branco puro para highlight
    highlightDark: '#c4b5fd40'    // violet-300 highlight mais visível
  }
}

interface PlayerColorContextType {
  colorTheme: PlayerColorTheme
  setColorTheme: (theme: PlayerColorTheme) => void
  getCurrentColors: (isDark?: boolean) => { unplayedColor: string; playedColor: string }
  getUIColors: (isDark?: boolean) => { 
    background: string
    accent: string
    shadow: string
    highlight: string
    textPrimary: string
    textSecondary: string
  }
  getShadowClasses: (isDark?: boolean) => {
    normal: string
    inset: string
  }
  availableThemes: PlayerColorTheme[]
}

const PlayerColorContext = createContext<PlayerColorContextType | undefined>(undefined)

export function PlayerColorProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<PlayerColorTheme>('blue')

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('playerColorTheme') as PlayerColorTheme
    if (stored && Object.keys(colorSchemes).includes(stored)) {
      setColorThemeState(stored)
    }
  }, [])

  // Save to localStorage when changed
  const setColorTheme = (theme: PlayerColorTheme) => {
    setColorThemeState(theme)
    localStorage.setItem('playerColorTheme', theme)
  }

  // Get current colors based on theme and dark mode
  const getCurrentColors = (isDark: boolean = false) => {
    const scheme = colorSchemes[colorTheme]
    return {
      unplayedColor: isDark ? scheme.unplayedDark : scheme.unplayedLight,
      playedColor: isDark ? scheme.playedDark : scheme.playedLight
    }
  }

  // Get UI colors for backgrounds, accents etc
  const getUIColors = (isDark: boolean = false) => {
    const scheme = colorSchemes[colorTheme]
    return {
      background: isDark ? scheme.backgroundDark : scheme.backgroundLight,
      accent: isDark ? scheme.accentDark : scheme.accentLight,
      shadow: isDark ? scheme.shadowDark : scheme.shadowLight,
      highlight: isDark ? scheme.highlightDark : scheme.highlightLight,
      textPrimary: isDark ? scheme.textPrimaryDark : scheme.textPrimaryLight,
      textSecondary: isDark ? scheme.textSecondaryDark : scheme.textSecondaryLight
    }
  }

  // Get complete shadow classes for neumorphic design
  const getShadowClasses = (isDark: boolean = false) => {
    const { shadow, highlight } = getUIColors(isDark)
    return {
      normal: `shadow-[8px_8px_20px_${shadow},-8px_-8px_20px_${highlight}]`,
      inset: `shadow-[inset_8px_8px_20px_${shadow},inset_-8px_-8px_20px_${highlight}]`
    }
  }

  const value = {
    colorTheme,
    setColorTheme,
    getCurrentColors,
    getUIColors,
    getShadowClasses,
    availableThemes: Object.keys(colorSchemes) as PlayerColorTheme[]
  }

  return (
    <PlayerColorContext.Provider value={value}>
      {children}
    </PlayerColorContext.Provider>
  )
}

export function usePlayerColors() {
  const context = useContext(PlayerColorContext)
  if (context === undefined) {
    throw new Error('usePlayerColors must be used within a PlayerColorProvider')
  }
  return context
}