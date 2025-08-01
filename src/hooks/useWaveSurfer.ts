import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { usePlayerColors } from './usePlayerColors'

interface UseWaveSurferOptions {
  audioUrl: string
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  onPlayingChange?: (isPlaying: boolean) => void
}

export function useWaveSurfer({ audioUrl, onTimeUpdate, onDurationChange, onPlayingChange }: UseWaveSurferOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const { getCurrentColors, colorTheme } = usePlayerColors()

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return

    setIsLoading(true)
    setError(null)
    setIsPlaying(false)

    // Cleanup previous instance
    if (wavesurferRef.current) {
      try {
        wavesurferRef.current.destroy()
      } catch (e) {
        console.warn('Error destroying previous WaveSurfer instance:', e)
      }
      wavesurferRef.current = null
    }

    try {
      // Get theme colors using the new color system
      const isDark = document.documentElement.classList.contains('dark')
      const { unplayedColor, playedColor } = getCurrentColors(isDark)
      
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: unplayedColor,
        progressColor: playedColor, 
        cursorWidth: 0, // Remove cursor
        barWidth: 4,
        barGap: 3.5, // Increase gap by 75% (2 * 1.75 = 3.5)
        barRadius: 4,
        height: 80,
        normalize: true,
        mediaControls: false
      })

      wavesurferRef.current = wavesurfer

      // Event listeners
      wavesurfer.on('ready', () => {
        setIsLoading(false)
        const audioDuration = wavesurfer.getDuration()
        setDuration(audioDuration)
        onDurationChange?.(audioDuration)
      })

      wavesurfer.on('play', () => {
        setIsPlaying(true)
        onPlayingChange?.(true)
      })
      wavesurfer.on('pause', () => {
        setIsPlaying(false)
        onPlayingChange?.(false)
      })
      
      wavesurfer.on('audioprocess', () => {
        onTimeUpdate?.(wavesurfer.getCurrentTime())
      })

      wavesurfer.on('interaction', () => {
        onTimeUpdate?.(wavesurfer.getCurrentTime())
      })

      // Add seek event for better timestamp accuracy
      wavesurfer.on('seek', () => {
        onTimeUpdate?.(wavesurfer.getCurrentTime())
      })

      wavesurfer.on('error', (err) => {
        console.error('WaveSurfer error:', err)
        setError('Erro ao carregar áudio')
        setIsLoading(false)
      })

      // Load audio
      wavesurfer.load(audioUrl)

    } catch (err) {
      console.error('Error initializing WaveSurfer:', err)
      setError('Erro ao inicializar player')
      setIsLoading(false)
    }

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying WaveSurfer on cleanup:', e)
        }
        wavesurferRef.current = null
      }
    }
  }, [audioUrl, colorTheme]) // Re-create when color theme changes

  const togglePlayPause = useCallback(() => {
    if (wavesurferRef.current && !isLoading && !error) {
      try {
        wavesurferRef.current.playPause()
      } catch (err) {
        console.error('Error toggling play/pause:', err)
        setError('Erro ao reproduzir áudio')
      }
    }
  }, [isLoading, error])

  return {
    containerRef,
    wavesurfer: wavesurferRef.current,
    duration,
    isPlaying,
    isLoading,
    error,
    togglePlayPause
  }
}