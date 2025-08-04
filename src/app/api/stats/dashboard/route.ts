import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Get total songs
    const { data: songs, error: songsError } = await supabaseAdmin
      .from('songs')
      .select('id, listen_count')

    if (songsError) {
      console.error('Error fetching songs:', songsError)
      return NextResponse.json(
        { error: 'Erro ao buscar músicas: ' + songsError.message },
        { status: 500 }
      )
    }

    // Get total playlists
    const { data: playlists, error: playlistsError } = await supabaseAdmin
      .from('playlists')
      .select('id')

    if (playlistsError) {
      console.error('Error fetching playlists:', playlistsError)
      return NextResponse.json(
        { error: 'Erro ao buscar playlists: ' + playlistsError.message },
        { status: 500 }
      )
    }

    // Get total plays (sum of all listen counts)
    const totalPlays = songs?.reduce((sum, song) => sum + (song.listen_count || 0), 0) || 0

    // Get unique listeners (unique session_ids from listening_sessions)
    const { data: uniqueListeners, error: listenersError } = await supabaseAdmin
      .from('listening_sessions')
      .select('session_id')

    if (listenersError) {
      console.error('Error fetching unique listeners:', listenersError)
    }

    // Count unique session_ids
    const uniqueSessionIds = new Set(uniqueListeners?.map(session => session.session_id) || [])
    const totalUniqueListeners = uniqueSessionIds.size

    return NextResponse.json({
      totalSongs: songs?.length || 0,
      totalPlaylists: playlists?.length || 0,
      totalPlays,
      totalUniqueListeners
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}