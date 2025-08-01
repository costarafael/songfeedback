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
  const isCurrentlySequentialRef = useRef(true)
  const pendingSegmentRef = useRef<ListeningSegment | null>(null)
  
  // Constantes para detecção
  const SEQUENTIAL_THRESHOLD = 3 // segundos - mais tolerante para buffering
  const MIN_SEGMENT_DURATION = 2 // 2 segundos mínimo para evitar micro-segmentos
  const BATCH_SAVE_INTERVAL = 10000 // 10 segundos - menos requests
  
  // Função para salvar segmento com validação
  const saveSegment = useCallback(async (segment: ListeningSegment) => {
    // Validar segmento antes de salvar
    if (segment.endTime <= segment.startTime || 
        segment.startTime < 0 || 
        segment.endTime > duration ||
        (segment.endTime - segment.startTime) < MIN_SEGMENT_DURATION) {
      console.warn('Invalid segment ignored:', segment)
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
      }
    } catch (error) {
      console.error('Error saving listening segment:', error)
    }
  }, [onSegmentComplete, duration])
  
  // Finalizar segmento pendente (sem duplicação)
  const finalizePendingSegment = useCallback(() => {
    if (pendingSegmentRef.current) {
      const segment = pendingSegmentRef.current
      if (segment.endTime - segment.startTime >= MIN_SEGMENT_DURATION) {
        // Verificar se não é duplicado do último segmento salvo
        const lastSegment = segments[segments.length - 1]
        if (!lastSegment || 
            lastSegment.startTime !== segment.startTime || 
            Math.abs(lastSegment.endTime - segment.endTime) > 1) {
          saveSegment(segment)
        }
      }
      pendingSegmentRef.current = null
    }
  }, [saveSegment, segments])
  
  // Tracking principal
  useEffect(() => {
    if (!isPlaying || duration === 0) return
    
    const timeDiff = Math.abs(currentTime - lastTimeRef.current)
    
    // Primeira execução - inicializar
    if (lastTimeRef.current === 0) {
      segmentStartRef.current = currentTime
      isCurrentlySequentialRef.current = true
      lastTimeRef.current = currentTime
      return
    }
    
    // Detectar navegação (salto > threshold)
    if (timeDiff > SEQUENTIAL_THRESHOLD) {
      // Finalizar segmento anterior se válido
      const segmentDuration = lastTimeRef.current - segmentStartRef.current
      if (segmentDuration >= MIN_SEGMENT_DURATION) {
        const completedSegment: ListeningSegment = {
          startTime: segmentStartRef.current,
          endTime: lastTimeRef.current,
          isSequential: isCurrentlySequentialRef.current,
          sessionId,
          songId
        }
        
        // Salvar imediatamente em caso de navegação
        saveSegment(completedSegment)
      }
      
      // Iniciar novo segmento
      segmentStartRef.current = currentTime
      isCurrentlySequentialRef.current = false // Navegação detectada
      pendingSegmentRef.current = null // Limpar pendente
    } else {
      // Reprodução sequencial continua
      isCurrentlySequentialRef.current = true
      
      // Só atualizar pendente se mudou significativamente (evitar spam)
      const pendingDuration = currentTime - segmentStartRef.current
      if (pendingDuration >= MIN_SEGMENT_DURATION) {
        pendingSegmentRef.current = {
          startTime: segmentStartRef.current,
          endTime: currentTime,
          isSequential: isCurrentlySequentialRef.current,
          sessionId,
          songId
        }
      }
    }
    
    lastTimeRef.current = currentTime
  }, [currentTime, isPlaying, duration, sessionId, songId, saveSegment])
  
  // Batch save periódico
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      finalizePendingSegment()
    }, BATCH_SAVE_INTERVAL)
    
    return () => clearInterval(interval)
  }, [isPlaying, finalizePendingSegment])
  
  // Finalizar ao pausar/parar
  useEffect(() => {
    if (!isPlaying) {
      finalizePendingSegment()
    }
  }, [isPlaying, finalizePendingSegment])
  
  // Save robusto em beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSegmentRef.current) {
        // Usar sendBeacon para garantir envio mesmo se página fechar
        const data = JSON.stringify(pendingSegmentRef.current)
        if ('sendBeacon' in navigator) {
          navigator.sendBeacon('/api/listening-segments', data)
        } else {
          // Fallback síncrono (pode não funcionar sempre)
          fetch('/api/listening-segments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true
          }).catch(console.error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      finalizePendingSegment()
    }
  }, [finalizePendingSegment])
  
  // Calcular completion percentage
  const completionPercentage = duration > 0 ? (totalListenedTime / duration) * 100 : 0
  
  return {
    segments,
    totalListenedTime,
    completionPercentage: Math.min(100, completionPercentage),
    isTracking: isPlaying
  }
}