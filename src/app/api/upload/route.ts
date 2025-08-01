import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const durationStr = formData.get('duration') as string

    if (!file || !title) {
      return NextResponse.json(
        { error: 'Arquivo e título são obrigatórios' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: fileData, error: uploadError } = await supabaseAdmin.storage
      .from('songs')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro no upload: ' + uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('songs')
      .getPublicUrl(fileName)

    // Parse duration from frontend
    let duration: number | null = null
    if (durationStr && !isNaN(parseFloat(durationStr))) {
      duration = Math.round(parseFloat(durationStr))
      console.log('Duration received from frontend:', duration, 'seconds')
    }

    // Save to database
    const { data: songData, error: dbError } = await supabaseAdmin
      .from('songs')
      .insert({
        title,
        artist: artist || null,
        file_url: publicUrl,
        duration: duration // Use extracted duration or null
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

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso!',
      song: songData,
      songId: songData.id
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}