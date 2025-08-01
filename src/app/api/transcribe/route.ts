import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

// Supabase client configurado para API routes

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_2ca0e00e81f8e3a5455f8854874b7f16bbfb71c66a8956d6'
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/speech-to-text'

interface ElevenLabsWord {
  text: string
  start: number
  end: number
  type: 'word' | 'spacing'
  logprob: number
}

interface ElevenLabsResponse {
  language_code: string
  language_probability: number
  text: string
  words: ElevenLabsWord[]
}

export async function POST(request: NextRequest) {
  let songId: string = ''
  
  try {
    const formData = await request.formData()
    songId = formData.get('songId') as string
    const audioFile = formData.get('audioFile') as File

    // Log básico para monitoramento
    console.log(`🎵 Transcription started for song: ${songId}`)

    if (!songId || !audioFile) {
      console.error('❌ Missing required parameters')
      return NextResponse.json(
        { error: 'songId e audioFile são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar status para 'processing'
    await supabase
      .from('songs')
      .update({ 
        transcription_status: 'processing',
        transcription_job_id: `job_${Date.now()}_${songId}`
      })
      .eq('id', songId)

    // Preparar dados para ElevenLabs
    const elevenLabsFormData = new FormData()
    elevenLabsFormData.append('model_id', 'scribe_v1')
    elevenLabsFormData.append('file', audioFile)
    elevenLabsFormData.append('timestamps', 'true')
    elevenLabsFormData.append('word_timestamps', 'true')

    // Fazer chamada para ElevenLabs
    const elevenLabsResponse = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: elevenLabsFormData
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error(`❌ ElevenLabs API error ${elevenLabsResponse.status}:`, errorText)
      
      // Atualizar status para 'failed'
      await supabase
        .from('songs')
        .update({ transcription_status: 'failed' })
        .eq('id', songId)

      return NextResponse.json(
        { error: `Erro na API ElevenLabs: ${elevenLabsResponse.status} - ${errorText}` },
        { status: 500 }
      )
    }

    const transcriptionResult: ElevenLabsResponse = await elevenLabsResponse.json()
    
    console.log(`✅ Transcription completed: "${transcriptionResult.text}" (${transcriptionResult.language_code}, ${(transcriptionResult.language_probability * 100).toFixed(1)}%)`)

    // Não definir duração baseado na transcrição
    // A transcrição só cobre partes vocais, não a música inteira
    // A duração real será definida pelo player quando o áudio carregar

    // Preparar dados para salvar
    const updateData = {
      transcription_status: 'completed' as const,
      transcribed_text: transcriptionResult.text,
      transcription_data: transcriptionResult,
      transcription_language: transcriptionResult.language_code,
      transcription_confidence: transcriptionResult.language_probability,
      transcribed_at: new Date().toISOString()
      // Removido: duration não deve ser baseada na transcrição
    }

    // Salvar resultado no banco
    const { error: updateError } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', songId)

    if (updateError) {
      console.error('❌ Database update error:', updateError.message)
      return NextResponse.json(
        { error: `Erro ao salvar transcrição: ${updateError.message}` },
        { status: 500 }
      )
    }

    console.log(`💾 Transcription saved to database for song: ${songId}`)

    return NextResponse.json({
      success: true,
      transcription: {
        text: transcriptionResult.text,
        language: transcriptionResult.language_code,
        confidence: transcriptionResult.language_probability,
        wordCount: transcriptionResult.words?.length || 0,
        duration: audioDuration
      }
    })

  } catch (error) {
    console.error('❌ Erro geral na transcrição:', error)
    
    // Tentar atualizar status para 'failed' se temos songId
    if (songId) {
      const { error: updateError } = await supabase
        .from('songs')
        .update({ transcription_status: 'failed' })
        .eq('id', songId)
      
      if (updateError) {
        console.error('Error updating transcription status:', updateError)
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}