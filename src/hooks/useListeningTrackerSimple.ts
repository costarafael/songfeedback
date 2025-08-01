'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface ListeningSegment {
  startTime: number
  endTime: number
  isSequential: boolean
  sessionId: string
  songId: string
}

interface UseListeningTrackerProps {
  sessionId: string
  songId: string
  duration: number
  currentTime: number
  isPlaying: boolean
  onSegmentComplete?: (segment: ListeningSegment) => void
}

export const useListeningTracker = ({
  sessionId,
  songId,
  duration,
  currentTime,
  isPlaying,
  onSegmentComplete
}: UseListeningTrackerProps) => {
  const [segments, setSegments] = useState<ListeningSegment[]>([])
  const [totalListenedTime, setTotalListenedTime] = useState(0)
  
  const lastTimeRef = useRef(0)
  const segmentStartRef = useRef(0)
  const isTrackingRef = useRef(false)
  const lastSaveTimeRef = useRef(0)
  
  // Constantes
  const SEQUENTIAL_THRESHOLD = 3 // segundos
  const MIN_SEGMENT_DURATION = 3 // 3 segundos mínimo
  const SAVE_INTERVAL = 15 // Salvar a cada 15 segundos
  
  // Função para salvar segmento
  const saveSegment = useCallback(async (segment: ListeningSegment) => {
    // Validação básica
    if (segment.endTime <= segment.startTime || 
        segment.startTime < 0 || 
        segment.endTime > duration ||
        (segment.endTime - segment.startTime) < MIN_SEGMENT_DURATION) {
      return
    }

    try {
      const response = await fetch('/api/listening-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segment)
      })
      
      if (response.ok) {
        setSegments(prev => [...prev, segment])
        setTotalListenedTime(prev => prev + (segment.endTime - segment.startTime))
        onSegmentComplete?.(segment)
        // Segment saved successfully
      } else {
        console.error('Failed to save segment:', response.status)
      }
    } catch (error) {
      console.error('Error saving listening segment:', error)
    }
  }, [onSegmentComplete, duration])
  
  // Tracking simplificado
  useEffect(() => {
    // Só começar tracking quando estiver tocando
    if (isPlaying && duration > 0) {
      const timeDiff = Math.abs(currentTime - lastTimeRef.current)
      
      // Primeira vez ou grande salto (navegação)
      if (!isTrackingRef.current || timeDiff > SEQUENTIAL_THRESHOLD) {
        // Finalizar segmento anterior se existir
        if (isTrackingRef.current && (lastTimeRef.current - segmentStartRef.current) >= MIN_SEGMENT_DURATION) {
          const segment: ListeningSegment = {
            startTime: segmentStartRef.current,
            endTime: lastTimeRef.current,
            isSequential: timeDiff <= SEQUENTIAL_THRESHOLD, // Era sequencial se não houve grande salto
            sessionId,
            songId
          }
          saveSegment(segment)
        }
        
        // Iniciar novo segmento
        segmentStartRef.current = currentTime
        isTrackingRef.current = true
        lastSaveTimeRef.current = Date.now()
      }
      
      // Save periódico (a cada 15 segundos de reprodução)
      const now = Date.now()
      if (now - lastSaveTimeRef.current >= SAVE_INTERVAL * 1000) {
        const segmentDuration = currentTime - segmentStartRef.current
        if (segmentDuration >= MIN_SEGMENT_DURATION) {
          const segment: ListeningSegment = {
            startTime: segmentStartRef.current,
            endTime: currentTime,
            isSequential: true, // É sequencial se chegou até aqui
            sessionId,
            songId
          }
          saveSegment(segment)
          
          // Reiniciar para próximo segmento
          segmentStartRef.current = currentTime
          lastSaveTimeRef.current = now
        }
      }
      
      lastTimeRef.current = currentTime
    } else {
      // Parou de tocar - finalizar segmento atual
      if (isTrackingRef.current && (lastTimeRef.current - segmentStartRef.current) >= MIN_SEGMENT_DURATION) {
        const segment: ListeningSegment = {
          startTime: segmentStartRef.current,
          endTime: lastTimeRef.current,
          isSequential: true,
          sessionId,
          songId
        }
        saveSegment(segment)
      }
      isTrackingRef.current = false
    }
  }, [currentTime, isPlaying, duration, sessionId, songId, saveSegment])
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isTrackingRef.current && (lastTimeRef.current - segmentStartRef.current) >= MIN_SEGMENT_DURATION) {
        const segment: ListeningSegment = {
          startTime: segmentStartRef.current,
          endTime: lastTimeRef.current,
          isSequential: true,
          sessionId,
          songId
        }
        
        // Usar sendBeacon para garantir envio
        const data = JSON.stringify(segment)
        if ('sendBeacon' in navigator) {
          navigator.sendBeacon('/api/listening-segments', data)
        }
      }
    }
  }, [sessionId, songId])
  
  const completionPercentage = duration > 0 ? (totalListenedTime / duration) * 100 : 0
  
  return {
    segments,
    totalListenedTime,
    completionPercentage: Math.min(100, completionPercentage),
    isTracking: isTrackingRef.current
  }
}