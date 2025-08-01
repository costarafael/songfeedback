import { supabase } from '@/lib/supabase'
import { Song, Reaction, ReactionStats } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import StatsCharts from '@/components/Admin/StatsCharts'
import ListeningHeatmap from '@/components/Admin/ListeningHeatmap'
import SkippedSegments from '@/components/Admin/SkippedSegments'

async function getSongWithStats(songId: string) {
  // Get song data
  const { data: song, error: songError } = await supabase
    .from('songs')
    .select('*')
    .eq('id', songId)
    .single()

  if (songError) {
    return null
  }

  // Get reactions
  const { data: reactions, error: reactionsError } = await supabase
    .from('reactions')
    .select('*')
    .eq('song_id', songId)
    .order('timestamp')

  if (reactionsError) {
    console.error('Error fetching reactions:', reactionsError)
  }

  // Get listening sessions count
  const { count: sessionCount } = await supabase
    .from('listening_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('song_id', songId)

  // Get listening analytics directly from database
  let listeningAnalytics = null
  try {
    // Buscar estatísticas das sessões
    const { data: sessionStats, error: sessionError } = await supabase
      .from('listening_sessions')
      .select('total_listened_time, completion_percentage, skip_count')
      .eq('song_id', songId)

    // Buscar segmentos para heatmap
    const { data: segments, error: segmentsError } = await supabase
      .from('listening_segments')
      .select('start_time, end_time, is_sequential')
      .eq('song_id', songId)
      .order('start_time')

    if (!sessionError && !segmentsError && sessionStats && segments) {
      const totalSessions = sessionStats.length
      const avgCompletionRate = totalSessions > 0 
        ? sessionStats.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / totalSessions 
        : 0
      const totalSkips = sessionStats.reduce((sum, s) => sum + (s.skip_count || 0), 0) || 0

      // Debug logging
      console.log('Debug - Analytics Data:', {
        songDuration: song.duration,
        totalSessions,
        segmentsCount: segments.length,
        firstSegment: segments[0],
        lastSegment: segments[segments.length - 1]
      })

      // Gerar heatmap
      const heatmap = generateHeatmap(segments, song.duration || 0, 100)
      const mostSkippedSegments = findMostSkippedSegments(segments, song.duration || 0)

      console.log('Debug - Generated Heatmap:', {
        heatmapLength: heatmap.length,
        duration: song.duration,
        firstPoint: heatmap[0],
        lastPoint: heatmap[heatmap.length - 1]
      })

      listeningAnalytics = {
        totalSessions,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        totalSkips,
        heatmap,
        mostSkippedSegments
      }
    }
  } catch (error) {
    console.error('Error fetching listening analytics:', error)
  }

  return {
    song: song as Song,
    reactions: reactions as Reaction[] || [],
    sessionCount: sessionCount || 0,
    listeningAnalytics
  }
}

function processReactionStats(reactions: Reaction[]): ReactionStats[] {
  const statsMap = new Map<string, ReactionStats>()

  reactions.forEach(reaction => {
    if (!statsMap.has(reaction.reaction_type)) {
      statsMap.set(reaction.reaction_type, {
        reaction_type: reaction.reaction_type,
        count: 0,
        timestamps: []
      })
    }
    
    const stats = statsMap.get(reaction.reaction_type)!
    stats.count++
    stats.timestamps.push(reaction.timestamp)
  })

  return Array.from(statsMap.values())
}

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function generateHeatmap(segments: any[], duration: number, resolution: number = 100) {
  if (duration <= 0) return []

  const bucketSize = duration / resolution
  const buckets = Array(resolution).fill(0)

  // Calcular tempo real ouvido em cada bucket (evita contagem duplicada)
  segments.forEach(segment => {
    const segmentDuration = segment.end_time - segment.start_time
    if (segmentDuration <= 0) return

    const startBucket = Math.floor(segment.start_time / bucketSize)
    const endBucket = Math.min(resolution - 1, Math.floor(segment.end_time / bucketSize))
    
    for (let i = startBucket; i <= endBucket; i++) {
      const bucketStart = i * bucketSize
      const bucketEnd = (i + 1) * bucketSize
      
      // Calcular intersecção real entre segmento e bucket
      const intersectionStart = Math.max(segment.start_time, bucketStart)
      const intersectionEnd = Math.min(segment.end_time, bucketEnd)
      const intersectionDuration = Math.max(0, intersectionEnd - intersectionStart)
      
      // Adicionar tempo real ouvido (não apenas contagem)
      buckets[i] += intersectionDuration
    }
  })

  // Encontrar máximo tempo ouvido em um bucket para normalização
  const maxTimeInBucket = Math.max(...buckets, bucketSize)
  
  return buckets.map((timeListened, index) => ({
    time: index * bucketSize,
    intensity: Math.min(1, timeListened / bucketSize), // Intensidade: 0-1 (proporção do bucket ouvida)
    listenCount: Math.round(timeListened) // Tempo em segundos ouvido neste bucket
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

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getSongWithStats(id)
  
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Música não encontrada</div>
      </div>
    )
  }

  const { song, reactions, sessionCount, listeningAnalytics } = data
  const reactionStats = processReactionStats(reactions)
  const totalReactions = reactions.length

  const reactionEmojis = {
    love: '❤️',
    like: '👍',
    dislike: '👎',
    angry: '😠'
  }

  const reactionColors = {
    love: 'text-green-600',
    like: 'text-blue-600', 
    dislike: 'text-yellow-600',
    angry: 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Admin</span>
        </Link>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Estatísticas: {song.title}</h1>
            {song.artist && (
              <p className="text-xl text-gray-600">por {song.artist}</p>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Reproduções</h3>
              <p className="text-3xl font-bold text-blue-600">{song.listen_count}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Sessões</h3>
              <p className="text-3xl font-bold text-green-600">{sessionCount}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Total Reações</h3>
              <p className="text-3xl font-bold text-purple-600">{totalReactions}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700">Duração</h3>
              <p className="text-3xl font-bold text-gray-600">
                {song.duration ? formatTime(song.duration) : 'N/A'}
              </p>
            </div>

            {listeningAnalytics && (
              <>
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-700">Taxa Conclusão</h3>
                  <p className="text-3xl font-bold text-indigo-600">{listeningAnalytics.avgCompletionRate}%</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-700">Pulos</h3>
                  <p className="text-3xl font-bold text-red-600">{listeningAnalytics.totalSkips}</p>
                </div>
              </>
            )}
          </div>

          {/* Reaction Breakdown */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Distribuição de Reações</h2>
            
            {reactionStats.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Nenhuma reação registrada ainda</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reactionStats.map((stat) => {
                  const percentage = totalReactions > 0 ? (stat.count / totalReactions * 100).toFixed(1) : '0'
                  
                  return (
                    <div key={stat.reaction_type} className="text-center p-4 border rounded-lg">
                      <div className="text-4xl mb-2">
                        {reactionEmojis[stat.reaction_type]}
                      </div>
                      <div className={`text-2xl font-bold ${reactionColors[stat.reaction_type]}`}>{stat.count}</div>
                      <div className="text-sm text-gray-600">{percentage}%</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {stat.reaction_type === 'love' ? 'Amei' :
                         stat.reaction_type === 'like' ? 'Gostei' :
                         stat.reaction_type === 'dislike' ? 'Não gostei' : 'Descontente'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Listening Analytics */}
          {listeningAnalytics && listeningAnalytics.heatmap && (
            <div className="mb-8">
              <ListeningHeatmap 
                heatmap={listeningAnalytics.heatmap}
                duration={song.duration || 0}
              />
            </div>
          )}

          {/* Skipped Segments */}
          {listeningAnalytics && listeningAnalytics.mostSkippedSegments && (
            <div className="mb-8">
              <SkippedSegments 
                segments={listeningAnalytics.mostSkippedSegments}
              />
            </div>
          )}

          {/* Timeline Visualization */}
          {reactions.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Timeline de Reações</h2>
              <StatsCharts 
                reactions={reactions} 
                duration={song.duration || 0}
                reactionStats={reactionStats}
              />
            </div>
          )}

          {/* Recent Reactions */}
          {reactions.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
              <h2 className="text-2xl font-semibold mb-6">Reações Recentes</h2>
              <div className="space-y-2">
                {reactions.slice(-10).reverse().map((reaction, index) => (
                  <div key={reaction.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{reactionEmojis[reaction.reaction_type]}</span>
                      <span className="capitalize">
                        {reaction.reaction_type === 'love' ? 'Amei' :
                         reaction.reaction_type === 'like' ? 'Gostei' :
                         reaction.reaction_type === 'dislike' ? 'Não gostei' : 'Descontente'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(reaction.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}