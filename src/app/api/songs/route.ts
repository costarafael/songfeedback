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

    return NextResponse.json(songs)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, artist, file_url } = body

    if (!title || !file_url) {
      return NextResponse.json(
        { error: 'Título e file_url são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: song, error } = await supabaseAdmin
      .from('songs')
      .insert([{
        title,
        artist: artist || null,
        file_url,
        upload_date: new Date().toISOString(),
        listen_count: 0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating song:', error)
      return NextResponse.json(
        { error: 'Erro ao criar música: ' + error.message },
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

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, title, artist } = body

    if (!id || !title) {
      return NextResponse.json(
        { error: 'ID e título são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: song, error } = await supabaseAdmin
      .from('songs')
      .update({
        title,
        artist: artist || null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating song:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar música: ' + error.message },
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