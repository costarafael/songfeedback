import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const { data: songs, error } = await supabaseAdmin
      .from('songs')
      .select('*')
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching songs:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar músicas: ' + error.message },
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