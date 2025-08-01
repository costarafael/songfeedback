import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: songs, error } = await supabaseAdmin
      .from('playlist_songs')
      .select(`
        id,
        song_id,
        position,
        song:songs(*)
      `)
      .eq('playlist_id', id)
      .order('position')

    if (error) {
      console.error('Error fetching playlist songs:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar músicas da playlist: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ songs })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { songId } = await request.json()

    if (!songId) {
      return NextResponse.json(
        { error: 'ID da música é obrigatório' },
        { status: 400 }
      )
    }

    // Get next position
    const { data: maxPosition } = await supabaseAdmin
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (maxPosition?.position || 0) + 1

    const { data: playlistSong, error } = await supabaseAdmin
      .from('playlist_songs')
      .insert({
        playlist_id: id,
        song_id: songId,
        position: nextPosition
      })
      .select(`
        id,
        song_id,
        position,
        song:songs(*)
      `)
      .single()

    if (error) {
      console.error('Error adding song to playlist:', error)
      return NextResponse.json(
        { error: 'Erro ao adicionar música à playlist: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ playlistSong })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}