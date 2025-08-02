import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find playlist by share token
    const { data: playlist, error: playlistError } = await supabaseAdmin
      .from('playlists')
      .select('*')
      .eq('share_token', token)
      .single()

    if (playlistError || !playlist) {
      return NextResponse.json(
        { error: 'Playlist não encontrada' },
        { status: 404 }
      )
    }

    // Get playlist songs
    const { data: songs, error: songsError } = await supabaseAdmin
      .from('playlist_songs')
      .select(`
        id,
        song_id,
        position,
        song:songs(*)
      `)
      .eq('playlist_id', playlist.id)
      .order('position')

    if (songsError) {
      console.error('Error fetching playlist songs:', songsError)
      return NextResponse.json(
        { error: 'Erro ao buscar músicas da playlist: ' + songsError.message },
        { status: 500 }
      )
    }

    // Transform the songs data to match the expected format
    const transformedSongs = songs?.map(playlistSong => ({
      ...playlistSong,
      song: playlistSong.song
    })) || []

    return NextResponse.json({ 
      playlist: {
        ...playlist,
        songs: transformedSongs
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}