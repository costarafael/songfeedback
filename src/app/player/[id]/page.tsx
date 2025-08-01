'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Song, Reaction, ReactionType } from '@/lib/types'
import WaveSurferPlayer from '@/components/Player/WaveSurferPlayer'
import ReactionButtons from '@/components/ReactButtons/ReactionButtons'
import FixedThemePlayerWrapper from '@/components/FixedThemePlayerWrapper'
import { useListeningTracker } from '@/hooks/useListeningTrackerSimple'
import { useNeumorphicStyles } from '@/hooks/useNeumorphicStyles'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const songId = Array.isArray(params.id) ? params.id[0] : params.id
  const { getButtonStyles, getPanelStyles, getTextStyles } = useNeumorphicStyles()
  
  const [song, setSong] = useState<Song | null>(null)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [loading, setLoading] = useState(true)
  const [showLyrics, setShowLyrics] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Tracking de partes ouvidas
  const listeningTracker = useListeningTracker({
    sessionId,
    songId: song?.id || '',
    duration,
    currentTime,
    isPlaying,
    onSegmentComplete: (segment) => {
      // Segment completed - could add analytics here
    }
  })

  useEffect(() => {
    if (!songId) return

    async function fetchSong() {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .single()

      if (error) {
        console.error('Error fetching song:', error)
        router.push('/')
        return
      }

      setSong(data)
      
      // Fetch existing reactions only for this session
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('*')
        .eq('song_id', songId)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (reactionsData) {
        setReactions(reactionsData)
      }

      setLoading(false)

      // Create listening session
      await supabase
        .from('listening_sessions')
        .insert({
          song_id: songId,
          session_id: sessionId
        })

      // Increment listen count
      await supabase
        .from('songs')
        .update({ listen_count: data.listen_count + 1 })
        .eq('id', songId)
    }

    fetchSong()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, sessionId])

  const handleReaction = async (reactionType: ReactionType) => {
    if (!song) return

    const newReaction = {
      song_id: song.id,
      reaction_type: reactionType,
      timestamp: currentTime,
      session_id: sessionId
    }

    const { data, error } = await supabase
      .from('reactions')
      .insert(newReaction)
      .select()
      .single()

    if (error) {
      console.error('Error saving reaction:', error)
    } else if (data) {
      // Add to local state immediately for visual feedback
      setReactions(prev => [...prev, data])
    }
  }

  const handleReactionClick = (reaction: Reaction) => {
    // The navigation is already handled by the regions plugin
    // This function can be used for additional actions if needed
    console.log('Clicked reaction at timestamp:', reaction.timestamp)
  }

  const handleDurationChange = async (newDuration: number) => {
    setDuration(newDuration)
    
    // Update duration in database only if not set or significantly different
    if (song && (!song.duration || song.duration === 0 || Math.abs(song.duration - newDuration) > 5)) {
      try {
        await fetch('/api/update-duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: song.id,
            duration: newDuration
          })
        })
      } catch (error) {
        console.error('Error updating duration:', error)
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <FixedThemePlayerWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl" style={getTextStyles('primary')}>Carregando música...</div>
        </div>
      </FixedThemePlayerWrapper>
    )
  }

  if (!song) {
    return (
      <FixedThemePlayerWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl" style={getTextStyles('primary')}>Música não encontrada</div>
        </div>
      </FixedThemePlayerWrapper>
    )
  }

  return (
    <FixedThemePlayerWrapper>
      <div className="container mx-auto px-4 py-8">

        <div className="flex flex-col items-center space-y-8">
          {/* Player Section */}
          <div className="space-y-4 w-full flex flex-col items-center">
            <WaveSurferPlayer
              audioUrl={song.file_url}
              reactions={reactions}
              transcriptionData={song.transcription_data}
              showLyrics={showLyrics}
              listeningSegments={listeningTracker.segments}
              onTimeUpdate={setCurrentTime}
              onDurationChange={handleDurationChange}
              onPlayingChange={setIsPlaying}
              onReactionAdd={handleReaction}
              onReactionClick={handleReactionClick}
            />

            <div className="flex justify-between items-center w-full max-w-[600px] px-2 text-sm" style={getTextStyles('secondary')}>
              <span className="font-mono">{formatTime(currentTime)}</span>
              
              {/* Botão Ver Letra / Fechar */}
              {song.transcription_data && (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm"
                  style={getButtonStyles(showLyrics, 'small')}
                >
                  {showLyrics ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>fechar</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>ver letra</span>
                    </>
                  )}
                </button>
              )}
              
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Reactions Section */}
          <div className="flex flex-col items-center space-y-6">
            <ReactionButtons onReaction={handleReaction} />
            
            <div className="text-center text-sm max-w-md" style={getTextStyles('secondary')}>
              <p>Registre o que sente ao longo da música</p>
            </div>
          </div>
        </div>
      </div>
    </FixedThemePlayerWrapper>
  )
}