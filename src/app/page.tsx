'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Song } from '@/lib/types'
import FixedThemePlayerWrapper from '@/components/FixedThemePlayerWrapper'
import { useNeumorphicStyles } from '@/hooks/useNeumorphicStyles'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const { getButtonStyles, getPanelStyles, getTextStyles } = useNeumorphicStyles()

  useEffect(() => {
    async function fetchSongs() {
      const { data: songs, error } = await supabase
        .from('songs')
        .select('*')
        .order('upload_date', { ascending: false })

      if (error) {
        console.error('Error fetching songs:', error)
      } else {
        setSongs(songs || [])
      }
      setLoading(false)
    }

    fetchSongs()
  }, [])

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration) return '–:––'
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <FixedThemePlayerWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl" style={getTextStyles('primary')}>Carregando músicas...</div>
        </div>
      </FixedThemePlayerWrapper>
    )
  }

  return (
    <FixedThemePlayerWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={getTextStyles('primary')}>
              Feedback Song
            </h1>
            <p className="text-lg" style={getTextStyles('secondary')}>
              Escolha uma música para escutar e reagir
            </p>
          </div>

          {/* Músicas */}
          {songs.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6" style={getTextStyles('secondary')}>
                <p className="text-lg mb-4">Nenhuma música disponível</p>
                <p className="text-sm">Use o painel administrativo para adicionar músicas</p>
              </div>
              <Link 
                href="/admin" 
                className="inline-flex items-center px-6 py-3 text-lg font-medium"
                style={getButtonStyles(false, 'medium')}
              >
                Acessar Admin
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="rounded-2xl p-6 transition-all duration-200 hover:scale-[1.01]"
                  style={getPanelStyles()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {song.cover_image_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={song.cover_image_url} 
                            alt={`Capa de ${song.title}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold mb-1 truncate" style={getTextStyles('primary')}>
                          {song.title}
                        </h3>
                        
                        <div className="flex items-center space-x-4 text-sm" style={getTextStyles('secondary')}>
                          {song.artist && (
                            <>
                              <span>por {song.artist}</span>
                              <span>•</span>
                            </>
                          )}
                          {song.album && (
                            <>
                              <span>{song.album}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatDuration(song.duration)}</span>
                          {song.year && (
                            <>
                              <span>•</span>
                              <span>{song.year}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/player/${song.id}`}
                      className="flex items-center space-x-2 px-6 py-3 ml-4 font-medium transition-all duration-200"
                      style={getButtonStyles(false, 'medium')}
                    >
                      <Play className="w-5 h-5" />
                      <span>Escutar</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </FixedThemePlayerWrapper>
  )
}