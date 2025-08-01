import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  console.log('=== UPLOAD API START ===')
  
  try {
    // Check content length first
    const contentLength = request.headers.get('content-length')
    console.log('Content-Length header:', contentLength)
    
    if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) { // 20MB
      console.log('File too large, rejecting')
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite: 20MB' },
        { status: 413 }
      )
    }

    console.log('Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const durationStr = formData.get('duration') as string

    console.log('Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      title: title,
      artist: artist,
      duration: durationStr
    })

    if (!file || !title) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Arquivo e título são obrigatórios' },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > 20 * 1024 * 1024) { // 20MB
      console.log('File size too large:', file.size)
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite: 20MB' },
        { status: 413 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    // Convert File to ArrayBuffer
    console.log('Converting file to buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    console.log('Buffer created, size:', buffer.length)

    // Upload to Supabase Storage
    console.log('Uploading to Supabase storage...')
    const { data: fileData, error: uploadError } = await supabaseAdmin.storage
      .from('songs')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600'
      })
    
    console.log('Upload result:', { fileData, uploadError })

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

    const response = {
      success: true,
      message: 'Upload realizado com sucesso!',
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