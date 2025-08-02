import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Generate unique share token
function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET() {
  try {
    // Fetch playlists with their associated songs
    const { data: playlists, error } = await supabaseAdmin
      .from('playlists')
      .select(`
        *,
        songs:playlist_songs(
          position,
          song:songs(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching playlists:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar playlists: ' + error.message },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const transformedPlaylists = playlists?.map(playlist => ({
      ...playlist,
      songs: playlist.songs?.map((ps: any) => ps.song).sort((a: any, b: any) => 
        playlist.songs.find((ps: any) => ps.song.id === a.id)?.position - 
        playlist.songs.find((ps: any) => ps.song.id === b.id)?.position
      ) || []
    })) || []

    return NextResponse.json(transformedPlaylists)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, songIds } = body
    
    console.log('Creating playlist with data:', { name, description, songIds }) // Debug log

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome da playlist é obrigatório' },
        { status: 400 }
      )
    }

    // Generate unique share token
    let shareToken = generateShareToken()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('playlists')
        .select('id')
        .eq('share_token', shareToken)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        shareToken = generateShareToken()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Erro ao gerar token único' },
        { status: 500 }
      )
    }

    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        share_token: shareToken
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating playlist:', error)
      return NextResponse.json(
        { error: 'Erro ao criar playlist: ' + error.message },
        { status: 500 }
      )
    }

    // Add songs to playlist if provided
    if (songIds && Array.isArray(songIds) && songIds.length > 0) {
      const playlistSongs = songIds.map((songId, index) => ({
        playlist_id: playlist.id,
        song_id: songId,
        position: index + 1
      }))

      const { error: songsError } = await supabaseAdmin
        .from('playlist_songs')
        .insert(playlistSongs)

      if (songsError) {
        console.error('Error adding songs to playlist:', songsError)
        // Don't fail the entire request, just log the error
      }
    }

    return NextResponse.json(playlist)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}