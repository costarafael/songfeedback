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

    const { data: song, error } = await supabaseAdmin
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { error: 'Música não encontrada' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching song:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar música: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(song)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First check if song exists
    const { data: song, error: fetchError } = await supabaseAdmin
      .from('songs')
      .select('file_key')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Música não encontrada' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching song for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar música: ' + fetchError.message },
        { status: 500 }
      )
    }

    // Delete associated reactions first
    const { error: reactionsError } = await supabaseAdmin
      .from('reactions')
      .delete()
      .eq('song_id', id)

    if (reactionsError) {
      console.error('Error deleting reactions:', reactionsError)
    }

    // Delete associated listening sessions
    const { error: sessionsError } = await supabaseAdmin
      .from('listening_sessions')
      .delete()
      .eq('song_id', id)

    if (sessionsError) {
      console.error('Error deleting listening sessions:', sessionsError)
    }

    // Delete from playlist_songs table
    const { error: playlistError } = await supabaseAdmin
      .from('playlist_songs')
      .delete()
      .eq('song_id', id)

    if (playlistError) {
      console.error('Error deleting from playlists:', playlistError)
    }

    // Delete the file from Supabase Storage
    if (song.file_key) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('songs')
        .remove([song.file_key])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }
    }

    // Finally delete the song record
    const { error: deleteError } = await supabaseAdmin
      .from('songs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting song:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir música: ' + deleteError.message },
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