import { useEffect, useState, useCallback, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
// @ts-ignore - wavesurfer regions plugin doesn't have TypeScript types
import Regions from 'wavesurfer.js/dist/plugins/regions.js'
import { useTheme } from './useTheme'
import { getReactionColors, getReactionIcon } from '@/utils/reactionColors'
import { Reaction, ReactionType } from '@/lib/types'

export interface ReactionVisual extends Reaction {
  startPercent: number
  widthPercent: number
}

interface UseReactionVisualsProps {
  wavesurfer: WaveSurfer | null
  reactions: Reaction[]
  duration: number
  onRegionClick?: (reaction: Reaction) => void
}

export function useReactionVisuals({ 
  wavesurfer, 
  reactions, 
  duration,
  onRegionClick 
}: UseReactionVisualsProps) {
  const isDark = useTheme()
  const [reactionVisuals, setReactionVisuals] = useState<ReactionVisual[]>([])
  const regionsPluginRef = useRef<any>(null)
  const regionsRef = useRef<Map<string, any>>(new Map())

  // Initialize regions plugin
  useEffect(() => {
    if (!wavesurfer) return

    try {
      // Check if regions plugin is already registered
      if (!regionsPluginRef.current) {
        regionsPluginRef.current = Regions.create()
        wavesurfer.registerPlugin(regionsPluginRef.current)
      }
    } catch (error) {
      console.warn('Regions plugin already initialized or error:', error)
    }

    return () => {
      regionsRef.current.clear()
    }
  }, [wavesurfer])

  // Convert reactions to visual format
  useEffect(() => {
    if (!duration || duration === 0) return

    const visuals: ReactionVisual[] = reactions.map(reaction => {
      const reactionDuration = 2 // 2 seconds total (±1s) for better precision
      const startTime = Math.max(0, reaction.timestamp - 1)
      const endTime = Math.min(duration, reaction.timestamp + 1)
      
      return {
        ...reaction,
        startPercent: (startTime / duration) * 100,
        widthPercent: ((endTime - startTime) / duration) * 100
      }
    })

    setReactionVisuals(visuals)
  }, [reactions, duration])

  // Regions are disabled - we only use the overlay circles now
  // This effect is kept for potential future use but does nothing
  useEffect(() => {
    // No longer creating regions - overlay handles all visual feedback
  }, [reactionVisuals, wavesurfer, isDark, duration, onRegionClick])

  // Add new reaction - simplified since we don't create regions anymore
  const addReaction = useCallback((type: ReactionType, timestamp: number) => {
    // This function is kept for API compatibility but doesn't create regions
    // The visual feedback is now handled entirely by the ReactionOverlay component
    console.log('Reaction added:', type, 'at', timestamp)
    return null
  }, [])

  // Remove reaction - simplified since we don't use regions anymore  
  const removeReaction = useCallback((reactionId: string) => {
    // This function is kept for API compatibility but doesn't remove regions
    console.log('Reaction removed:', reactionId)
  }, [])

  // Update theme colors - no longer needed since we don't use regions
  // Theme changes are handled automatically by the ReactionOverlay component

  return {
    reactionVisuals,
    addReaction,
    removeReaction,
    regionsPlugin: regionsPluginRef.current
  }
}