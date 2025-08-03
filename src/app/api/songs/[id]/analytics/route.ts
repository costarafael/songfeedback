import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: songId } = await params
    
    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID required' },
        { status: 400 }
      )
    }

    // Buscar informações básicas da música
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id, title, duration')
      .eq('id', songId)
      .single()

    if (songError || !song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Buscar reações da música
    const { data: reactions, error: reactionsError } = await supabase
      .from('reactions')
      .select('*')
      .eq('song_id', songId)
      .order('timestamp', { ascending: true })

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError)
    }

    // Buscar estatísticas das sessões
    const { data: sessionStats, error: sessionError } = await supabase
      .from('listening_sessions')
      .select('*')
      .eq('song_id', songId)

    if (sessionError) {
      console.error('Error fetching session stats:', sessionError)
    }

    // Buscar todos os segmentos para gerar heatmap
    const { data: segments, error: segmentsError } = await supabase
      .from('listening_segments')
      .select('start_time, end_time, is_sequential')
      .eq('song_id', songId)
      .order('start_time')

    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError)
    }

    // Calcular estatísticas agregadas
    const totalSessions = sessionStats?.length || 0
    const avgCompletionRate = totalSessions > 0 && sessionStats
      ? sessionStats.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / totalSessions 
      : 0
    const avgListenedTime = totalSessions > 0 && sessionStats
      ? sessionStats.reduce((sum, s) => sum + (s.total_listened_time || 0), 0) / totalSessions
      : 0
    const totalSkips = sessionStats?.reduce((sum, s) => sum + (s.skip_count || 0), 0) || 0

    // Gerar heatmap (dividir música em 100 buckets)
    const heatmap = generateHeatmap(segments || [], song.duration || 0, 100)

    // Encontrar segmentos mais pulados
    const mostSkippedSegments = findMostSkippedSegments(segments || [], song.duration || 0)

    const analytics = {
      songId: song.id,
      title: song.title,
      duration: song.duration,
      totalSessions,
      avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
      avgListenedTime: Math.round(avgListenedTime * 100) / 100,
      totalSkips,
      avgSkipsPerSession: totalSessions > 0 ? Math.round((totalSkips / totalSessions) * 100) / 100 : 0,
      heatmap,
      mostSkippedSegments,
      reactions: reactions || [],
      totalReactions: reactions?.length || 0
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error in song analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateHeatmap(segments: any[], duration: number, resolution: number = 100) {
  if (duration <= 0) return []

  const bucketSize = duration / resolution
  const buckets = Array(resolution).fill(0)

  // Contar quantas vezes cada bucket foi ouvido
  segments.forEach(segment => {
    const startBucket = Math.floor(segment.start_time / bucketSize)
    const endBucket = Math.min(resolution - 1, Math.floor(segment.end_time / bucketSize))
    
    for (let i = startBucket; i <= endBucket; i++) {
      buckets[i]++
    }
  })

  // Normalizar (0-1) baseado no máximo
  const maxCount = Math.max(...buckets, 1)
  
  return buckets.map((count, index) => ({
    time: index * bucketSize,
    intensity: count / maxCount,
    listenCount: count
  }))
}

function findMostSkippedSegments(segments: any[], duration: number) {
  if (duration <= 0) return []

  // Dividir em segmentos de 30 segundos para análise
  const segmentSize = 30
  const numSegments = Math.ceil(duration / segmentSize)
  const segmentData = Array(numSegments).fill(0).map((_, index) => ({
    startTime: index * segmentSize,
    endTime: Math.min((index + 1) * segmentSize, duration),
    skipCount: 0,
    listenCount: 0
  }))

  // Analisar segmentos de escuta
  segments.forEach(segment => {
    const startSegmentIndex = Math.floor(segment.start_time / segmentSize)
    const endSegmentIndex = Math.min(numSegments - 1, Math.floor(segment.end_time / segmentSize))
    
    for (let i = startSegmentIndex; i <= endSegmentIndex; i++) {
      if (segment.is_sequential) {
        segmentData[i].listenCount++
      } else {
        segmentData[i].skipCount++
      }
    }
  })

  // Retornar os 5 segmentos mais pulados
  return segmentData
    .sort((a, b) => b.skipCount - a.skipCount)
    .slice(0, 5)
    .filter(seg => seg.skipCount > 0)
}