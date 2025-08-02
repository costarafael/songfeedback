'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { List, FileText, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Song, Reaction, ReactionType } from '@/lib/types'
import WaveSurferPlayer from '@/components/Player/WaveSurferPlayer'
import ReactionButtons from '@/components/ReactButtons/ReactionButtons'
import FixedThemePlayerWrapper from '@/components/FixedThemePlayerWrapper'
import { useListeningTracker } from '@/hooks/useListeningTrackerSimple'
import { useNeumorphicStyles } from '@/hooks/useNeumorphicStyles'
import { OnboardingModal } from '@/components/Onboarding/OnboardingModal'
import { useOnboarding } from '@/hooks/useOnboarding'

interface PlaylistData {
  id: string
  name: string
  description?: string
  songs: Array<{
    id: string
    song_id: string
    position: number
    song: Song
  }>
}

export default function PlaylistPage() {
  const params = useParams()
  const token = Array.isArray(params.token) ? params.token[0] : params.token
  const { getButtonStyles, getPanelStyles, getTextStyles } = useNeumorphicStyles()
  
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [loading, setLoading] = useState(true)
  const [showLyrics, setShowLyrics] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)

  // Onboarding
  const { isOnboardingOpen, completeOnboarding, closeOnboarding } = useOnboarding()

  const currentSong = playlist?.songs[currentSongIndex]?.song

  // Tracking de partes ouvidas
  const listeningTracker = useListeningTracker({
    sessionId,
    songId: currentSong?.id || '',
    duration,
    currentTime,
    isPlaying,
    onSegmentComplete: (segment) => {
      // Segment completed - could add analytics here
    }
  })

  useEffect(() => {
    if (!token) return

    async function fetchPlaylist() {
      try {
        const response = await fetch(`/api/playlists/share/${token}`)
        const data = await response.json()

        if (!response.ok) {
          console.error('Error fetching playlist:', data.error)
          return
        }

        if (!data.playlist.songs || data.playlist.songs.length === 0) {
          alert('Esta playlist está vazia.')
          return
        }

        setPlaylist(data.playlist)
        setLoading(false)

      } catch (error) {
        console.error('Error fetching playlist:', error)
      }
    }

    fetchPlaylist()
  }, [token])

  useEffect(() => {
    if (!currentSong) return

    async function fetchReactions() {
      if (!currentSong) return
      
      // Fetch existing reactions only for this session and current song
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('*')
        .eq('song_id', currentSong.id)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

      if (reactionsData) {
        setReactions(reactionsData)
      }

      // Create listening session for current song
      await supabase
        .from('listening_sessions')
        .insert({
          song_id: currentSong.id,
          session_id: sessionId
        })

      // Increment listen count for current song
      await supabase
        .from('songs')
        .update({ listen_count: currentSong.listen_count + 1 })
        .eq('id', currentSong.id)
    }

    fetchReactions()
  }, [currentSong, sessionId])

  const handleReaction = async (reactionType: ReactionType) => {
    if (!currentSong) return

    // Use the most recent currentTime state for better precision
    const reactionTimestamp = currentTime
    
    const newReaction = {
      song_id: currentSong.id,
      reaction_type: reactionType,
      timestamp: reactionTimestamp,
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
      setReactions(prev => [...prev, data])
    }
  }

  const handleReactionClick = (reaction: Reaction) => {
    console.log('Clicked reaction at timestamp:', reaction.timestamp)
  }

  const handleDurationChange = async (newDuration: number) => {
    setDuration(newDuration)
    
    // Update duration in database if not set or significantly different
    if (currentSong && (!currentSong.duration || currentSong.duration === 0 || Math.abs(currentSong.duration - newDuration) > 5)) {
      try {
        await fetch('/api/update-duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId: currentSong.id,
            duration: newDuration
          })
        })
      } catch (error) {
        console.error('Error updating duration:', error)
      }
    }
  }

  const goToNextSong = () => {
    if (!playlist || currentSongIndex >= playlist.songs.length - 1) return
    
    setCurrentSongIndex(prev => prev + 1)
    setCurrentTime(0)
    setReactions([])
    setShowLyrics(false)
  }

  const goToPreviousSong = () => {
    if (currentSongIndex <= 0) return
    
    setCurrentSongIndex(prev => prev - 1)
    setCurrentTime(0)
    setReactions([])
    setShowLyrics(false)
  }

  const goToSong = (index: number) => {
    if (!playlist || index < 0 || index >= playlist.songs.length) return
    
    setCurrentSongIndex(index)
    setCurrentTime(0)
    setReactions([])
    setShowLyrics(false)
    setShowPlaylist(false)
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
          <div className="text-xl" style={getTextStyles('primary')}>Carregando playlist...</div>
        </div>
      </FixedThemePlayerWrapper>
    )
  }

  if (!playlist || !currentSong) {
    return (
      <FixedThemePlayerWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl" style={getTextStyles('primary')}>Playlist não encontrada</div>
        </div>
      </FixedThemePlayerWrapper>
    )
  }

  return (
    <FixedThemePlayerWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div></div> {/* Spacer */}
          
          <div className="text-center">
            <h1 className="text-lg font-semibold" style={getTextStyles('primary')}>{playlist.name}</h1>
            <p className="text-sm" style={getTextStyles('secondary')}>
              {currentSongIndex + 1} de {playlist.songs.length}
            </p>
          </div>
          
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
            style={getButtonStyles(showPlaylist, 'medium')}
            title="Ver playlist"
            data-onboarding="playlist-button"
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist Sidebar */}
        {showPlaylist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden"
              style={getPanelStyles(false)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold" style={getTextStyles('primary')}>Playlist</h3>
                <button
                  onClick={() => setShowPlaylist(false)}
                  className="hover:opacity-70 transition-opacity"
                  style={getTextStyles('secondary')}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2 overflow-y-auto max-h-96">
                {playlist.songs.map((playlistSong, index) => (
                  <button
                    key={playlistSong.id}
                    onClick={() => goToSong(index)}
                    className="w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                    style={{
                      backgroundColor: index === currentSongIndex 
                        ? getTextStyles('primary').color + '15'
                        : 'transparent',
                      ...getTextStyles('primary')
                    }}
                  >
                    <div className="font-medium" style={getTextStyles('primary')}>{playlistSong.song.title}</div>
                    {playlistSong.song.artist && (
                      <div className="text-sm" style={getTextStyles('secondary')}>{playlistSong.song.artist}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center space-y-8">
          {/* Player Section */}
          <div className="space-y-4 w-full flex flex-col items-center">
            <WaveSurferPlayer
              audioUrl={currentSong.file_url}
              reactions={reactions}
              transcriptionData={currentSong.transcription_data}
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
              {currentSong.transcription_data && (
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
            <div data-onboarding="reactions">
              <ReactionButtons onReaction={handleReaction} />
            </div>
            
            <div className="text-center text-sm max-w-md" style={getTextStyles('secondary')}>
              <p>Registre o que sente ao longo da música</p>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        steps={[
          {
            title: "Reações durante a música",
            description: "Durante a música clique nas reações que desejar para indicar as partes que tenha ou não gostado",
            targetSelector: '[data-onboarding="reactions"]'
          },
          {
            title: "Navegar entre músicas",
            description: "Você pode navegar entre as músicas clicando no botão 'Ver playlist'",
            targetSelector: '[data-onboarding="playlist-button"]'
          },
          {
            title: "Controle de reprodução",
            description: "Você pode tocar a música ou pausar usando este botão",
            targetSelector: '[data-onboarding="play-button"]'
          }
        ]}
        isOpen={isOnboardingOpen}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </FixedThemePlayerWrapper>
  )
}