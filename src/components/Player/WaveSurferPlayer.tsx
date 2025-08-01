'use client'

import { useState } from 'react'
import { Play, Pause, FileText } from 'lucide-react'
import { useWaveSurfer } from '@/hooks/useWaveSurfer'
import { useReactionVisuals } from '@/hooks/useReactionVisuals'
import { useNeumorphicStyles } from '@/hooks/useNeumorphicStyles'
import ReactionOverlay from './ReactionOverlay'
import LyricsDisplay from './LyricsDisplay'
import { Reaction, ReactionType, ElevenLabsTranscription } from '@/lib/types'
import { ListeningSegment } from '@/hooks/useListeningTrackerSimple'

interface WaveSurferPlayerProps {
  audioUrl: string
  reactions?: Reaction[]
  transcriptionData?: ElevenLabsTranscription
  showLyrics?: boolean
  listeningSegments?: ListeningSegment[]
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  onPlayingChange?: (isPlaying: boolean) => void
  onReactionAdd?: (type: ReactionType) => void
  onReactionClick?: (reaction: Reaction) => void
}

export default function WaveSurferPlayer({ 
  audioUrl,
  reactions = [],
  transcriptionData,
  showLyrics = false,
  listeningSegments = [],
  onTimeUpdate, 
  onDurationChange,
  onPlayingChange,
  onReactionAdd,
  onReactionClick
}: WaveSurferPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const { getButtonStyles, getPanelStyles } = useNeumorphicStyles()
  const {
    containerRef,
    wavesurfer,
    duration,
    isPlaying,
    isLoading,
    error,
    togglePlayPause
  } = useWaveSurfer({
    audioUrl,
    onTimeUpdate: (time) => {
      setCurrentTime(time)
      onTimeUpdate?.(time)
    },
    onDurationChange,
    onPlayingChange
  })

  const {
    reactionVisuals,
    addReaction
  } = useReactionVisuals({
    wavesurfer,
    reactions,
    duration,
    onRegionClick: onReactionClick
  })

  return (
    <div className="w-full max-w-[600px]">
      <div 
        className="rounded-2xl p-6"
        style={getPanelStyles(true)}
      >
      <div className="flex items-center space-x-6">
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={getButtonStyles(false, 'medium')}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="text-muted-foreground text-sm mb-3">Carregando áudio...</div>
          )}
          
          {error && (
            <div className="text-destructive text-sm mb-3">{error}</div>
          )}
          
          <div className="relative">
            <div 
              ref={containerRef} 
              className="w-full rounded-xl p-3 relative z-10"
              style={getPanelStyles(true)}
            />
            
            {/* Reaction Overlay - positioned above waveform */}
            {!isLoading && !error && (
              <div className="absolute inset-0 z-20 pointer-events-none rounded-xl">
                <ReactionOverlay
                  reactions={reactionVisuals}
                  waveformHeight={80}
                  onReactionClick={onReactionClick}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Display de letras sincronizadas */}
      <LyricsDisplay
        transcriptionData={transcriptionData}
        currentTime={currentTime}
        isVisible={showLyrics}
        listeningSegments={listeningSegments}
      />
    </div>
  )
}