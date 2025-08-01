import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const { id, songId } = await params

    // Get the position of the song being removed
    const { data: removedSong } = await supabaseAdmin
      .from('playlist_songs')
      .select('position')
      .eq('id', songId)
      .single()

    if (!removedSong) {
      return NextResponse.json(
        { error: 'Música não encontrada na playlist' },
        { status: 404 }
      )
    }

    // Remove the song
    const { error: deleteError } = await supabaseAdmin
      .from('playlist_songs')
      .delete()
      .eq('id', songId)

    if (deleteError) {
      console.error('Error removing song from playlist:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover música da playlist: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Update positions of remaining songs using RPC
    const { error: updateError } = await supabaseAdmin
      .rpc('update_playlist_positions_after_delete', {
        playlist_id: id,
        deleted_position: removedSong.position
      })

    if (updateError) {
      console.error('Error updating positions:', updateError)
      // This is not critical, so we don't return error
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