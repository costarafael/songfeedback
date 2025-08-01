'use client'

import { ListeningSegment } from '@/hooks/useListeningTracker'

interface ListeningOverlayProps {
  segments: ListeningSegment[]
  duration: number
  waveformHeight: number
  currentTime: number
}

export default function ListeningOverlay({ 
  segments, 
  duration, 
  waveformHeight,
  currentTime 
}: ListeningOverlayProps) {
  if (duration === 0 || segments.length === 0) return null

  // Gerar overlay baseado nos segmentos
  const generateOverlaySegments = () => {
    return segments.map((segment, index) => {
      const startPercent = (segment.startTime / duration) * 100
      const widthPercent = ((segment.endTime - segment.startTime) / duration) * 100
      
      return {
        id: index,
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        isSequential: segment.isSequential
      }
    })
  }

  const overlaySegments = generateOverlaySegments()

  return (
    <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
      {overlaySegments.map((segment) => (
        <div
          key={segment.id}
          className={`absolute top-0 h-full transition-all duration-300 ${
            segment.isSequential 
              ? 'bg-green-400/20 dark:bg-green-500/15' // Partes ouvidas sequencialmente
              : 'bg-amber-400/25 dark:bg-amber-500/20'  // Partes ouvidas após navegação
          }`}
          style={{
            left: segment.left,
            width: segment.width,
            height: `${waveformHeight}px`
          }}
        />
      ))}
      
      {/* Indicar partes não ouvidas que já passaram */}
      {currentTime > 0 && (
        <div
          className="absolute top-0 h-full bg-gray-300/15 dark:bg-gray-600/10 transition-all duration-300"
          style={{
            left: 0,
            width: `${(currentTime / duration) * 100}%`,
            height: `${waveformHeight}px`,
            zIndex: -1 // Atrás dos segmentos ouvidos
          }}
        />
      )}
    </div>
  )
}