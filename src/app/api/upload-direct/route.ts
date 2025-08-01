import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// This endpoint only handles metadata, not file upload
export async function POST(request: NextRequest) {
  console.log('=== DIRECT UPLOAD API START ===')
  
  try {
    const body = await request.json()
    const { fileName, title, artist, duration, fileUrl } = body

    console.log('Direct upload metadata:', {
      fileName,
      title,
      artist,
      duration,
      fileUrl
    })

    if (!fileName || !title || !fileUrl) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Nome do arquivo, título e URL são obrigatórios' },
        { status: 400 }
      )
    }

    // Parse duration if provided
    let parsedDuration: number | null = null
    if (duration && !isNaN(parseFloat(duration))) {
      parsedDuration = Math.round(parseFloat(duration))
      console.log('Duration parsed:', parsedDuration, 'seconds')
    }

    // Save to database
    console.log('Saving to database...')
    const { data: songData, error: dbError } = await supabaseAdmin
      .from('songs')
      .insert({
        title,
        artist: artist || null,
        file_url: fileUrl,
        duration: parsedDuration
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Erro ao salvar no banco: ' + dbError.message },
        { status: 500 }
      )
    }

    const response = {
      success: true,
      message: 'Música registrada com sucesso!',
      song: songData,
      songId: songData.id
    }
    
    console.log('Sending success response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}