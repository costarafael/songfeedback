import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { songId, duration } = await request.json()

    if (!songId || !duration) {
      return NextResponse.json(
        { error: 'songId e duration são obrigatórios' },
        { status: 400 }
      )
    }

    // Update duration in database (without truncating)
    const { error } = await supabaseAdmin
      .from('songs')
      .update({ duration: Math.round(duration) })
      .eq('id', songId)

    if (error) {
      console.error('Error updating duration:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar duração: ' + error.message },
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