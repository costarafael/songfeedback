import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Nome do arquivo e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Creating signed upload URL for:', fileName, fileType)

    // Create a signed upload URL that allows the client to upload directly
    const { data, error } = await supabaseAdmin.storage
      .from('songs')
      .createSignedUploadUrl(fileName)

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json(
        { error: 'Erro ao criar URL de upload: ' + error.message },
        { status: 500 }
      )
    }

    // Get the public URL for the file
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('songs')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      uploadUrl: data.signedUrl,
      publicUrl: publicUrl,
      fileName: fileName
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}