import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('playlists')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting playlist:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir playlist: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, songIds } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome da playlist é obrigatório' },
        { status: 400 }
      )
    }

    // Update playlist info
    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .update({
        name: name.trim(),
        description: description?.trim() || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating playlist:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar playlist: ' + error.message },
        { status: 500 }
      )
    }

    // Update songs if provided
    if (songIds && Array.isArray(songIds)) {
      // First, remove all existing songs from the playlist
      const { error: deleteError } = await supabaseAdmin
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', id)

      if (deleteError) {
        console.error('Error removing existing songs:', deleteError)
      }

      // Then add the new songs with their positions
      if (songIds.length > 0) {
        const playlistSongs = songIds.map((songId, index) => ({
          playlist_id: id,
          song_id: songId,
          position: index + 1
        }))

        const { error: insertError } = await supabaseAdmin
          .from('playlist_songs')
          .insert(playlistSongs)

        if (insertError) {
          console.error('Error adding songs to playlist:', insertError)
          // Don't fail the entire request, just log the error
        }
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