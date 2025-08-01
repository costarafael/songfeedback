import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, songId, startTime, endTime, isSequential } = body
    
    // Validações básicas
    if (!sessionId || !songId || startTime == null || endTime == null) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'Invalid time range' },
        { status: 400 }
      )
    }
    
    // Inserir segmento no banco
    const { data, error } = await supabase
      .from('listening_segments')
      .insert({
        session_id: sessionId,
        song_id: songId,
        start_time: startTime,
        end_time: endTime,
        is_sequential: isSequential ?? true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving listening segment:', error)
      return NextResponse.json(
        { error: 'Failed to save segment' },
        { status: 500 }
      )
    }
    
    // Atualizar estatísticas da sessão (tentar, mas não falhar se não conseguir)
    try {
      const segmentDuration = endTime - startTime
      
      const { error: updateError } = await supabase.rpc('update_session_stats', {
        p_session_id: sessionId,
        p_duration_to_add: segmentDuration,
        p_is_skip: !isSequential
      })
      
      if (updateError) {
        console.warn('Error updating session stats (non-critical):', updateError)
      }
    } catch (error) {
      console.warn('Session stats update failed (non-critical):', error)
    }
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('Error in listening-segments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    // Buscar segmentos da sessão
    const { data: segments, error } = await supabase
      .from('listening_segments')
      .select('*')
      .eq('session_id', sessionId)
      .order('start_time', { ascending: true })
    
    if (error) {
      console.error('Error fetching segments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch segments' },
        { status: 500 }
      )
    }
    
    // Calcular estatísticas
    const totalListenedTime = segments.reduce((sum, segment) => 
      sum + (segment.end_time - segment.start_time), 0
    )
    
    const sequentialTime = segments
      .filter(s => s.is_sequential)
      .reduce((sum, segment) => sum + (segment.end_time - segment.start_time), 0)
    
    return NextResponse.json({
      segments,
      totalListenedTime,
      sequentialTime,
      skipCount: segments.filter(s => !s.is_sequential).length
    })
    
  } catch (error) {
    console.error('Error in listening-segments GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}