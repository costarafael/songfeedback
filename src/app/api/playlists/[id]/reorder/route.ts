import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { songIds } = await request.json()

    if (!Array.isArray(songIds)) {
      return NextResponse.json(
        { error: 'Lista de IDs das músicas é obrigatória' },
        { status: 400 }
      )
    }

    // Update positions for each song
    const updatePromises = songIds.map((songId: string, index: number) => {
      return supabaseAdmin
        .from('playlist_songs')
        .update({ position: index + 1 })
        .eq('playlist_id', id)
        .eq('song_id', songId)
    })

    const results = await Promise.all(updatePromises)
    
    // Check if any updates failed
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Error reordering songs:', errors)
      return NextResponse.json(
        { error: 'Erro ao reordenar algumas músicas' },
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