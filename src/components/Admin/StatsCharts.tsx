'use client'

import { Reaction, ReactionStats } from '@/lib/types'

interface StatsChartsProps {
  reactions: Reaction[]
  duration: number
  reactionStats: ReactionStats[]
}

export default function StatsCharts({ reactions, duration, reactionStats }: StatsChartsProps) {
  // Calculate intelligent duration
  const maxReactionTime = reactions.length > 0 ? Math.max(...reactions.map(r => r.timestamp)) : 0
  
  // Use the larger of: saved duration OR max reaction time + 30s buffer
  // This ensures we show the full timeline even if reactions happened near the end
  const safeDuration = Math.max(
    duration || 0,
    maxReactionTime + 30, // Add 30 seconds buffer after last reaction
    60 // Minimum 1 minute
  )

  // Create timeline visualization
  const timelineSegments = 50 // Divide song into 50 segments
  const segmentDuration = safeDuration / timelineSegments
  
  // Count reactions per segment
  const segmentCounts = new Array(timelineSegments).fill(0).map(() => ({
    love: 0,
    like: 0,
    dislike: 0,
    angry: 0,
    total: 0
  }))

  reactions.forEach((reaction) => {
    const segmentIndex = Math.min(
      Math.floor(reaction.timestamp / segmentDuration),
      timelineSegments - 1
    )
    
    if (segmentIndex >= 0 && segmentIndex < timelineSegments) {
      segmentCounts[segmentIndex][reaction.reaction_type]++
      segmentCounts[segmentIndex].total++
    }
  })

  const maxCount = Math.max(...segmentCounts.map(s => s.total))
  
  const reactionColors = {
    love: '#22c55e', // green-500
    like: '#3b82f6', // blue-500  
    dislike: '#eab308', // yellow-500
    angry: '#6b7280' // gray-500
  }

  const reactionEmojis = {
    love: '❤️',
    like: '👍',
    dislike: '👎',
    angry: '😠'
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">Timeline Analysis:</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>Duração salva:</strong> {duration ? `${duration}s` : 'Não definida'}
          </div>
          <div>
            <strong>Última reação:</strong> {maxReactionTime.toFixed(1)}s
          </div>
          <div>
            <strong>Duração calculada:</strong> {safeDuration}s
          </div>
          <div>
            <strong>Total reações:</strong> {reactions.length}
          </div>
          <div>
            <strong>Segmentos ativos:</strong> {segmentCounts.filter(s => s.total > 0).length}/{timelineSegments}
          </div>
          <div>
            <strong>Resolução:</strong> {segmentDuration.toFixed(1)}s/segmento
          </div>
        </div>
        {reactions.length > 0 && (
          <div className="mt-2">
            <strong>Range de reações:</strong> 
            {Math.min(...reactions.map(r => r.timestamp)).toFixed(1)}s - 
            {Math.max(...reactions.map(r => r.timestamp)).toFixed(1)}s
          </div>
        )}
      </div>

      {/* Timeline Heatmap */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Intensidade de Reações ao Longo do Tempo</h3>
        <div className="border rounded-lg p-4">
          <div className="flex items-end space-x-1 h-32">
            {segmentCounts.map((segment, index) => {
              const height = maxCount > 0 ? (segment.total / maxCount) * 100 : 0
              const timeInSong = (index * segmentDuration)
              const timeLabel = `${Math.floor(timeInSong / 60)}:${Math.floor(timeInSong % 60).toString().padStart(2, '0')}`
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-200 hover:bg-blue-300 transition-colors cursor-pointer relative group"
                  style={{ height: `${height}%`, minHeight: '2px' }}
                  title={`${timeLabel} - ${segment.total} reações`}
                >
                  {segment.total > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div>{timeLabel}</div>
                      <div>{segment.total} reações</div>
                      {segment.love > 0 && <div>❤️ {segment.love}</div>}
                      {segment.like > 0 && <div>👍 {segment.like}</div>}
                      {segment.dislike > 0 && <div>👎 {segment.dislike}</div>}
                      {segment.angry > 0 && <div>😠 {segment.angry}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Time labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0:00</span>
            <span>
              {Math.floor(safeDuration / 60)}:{(Math.floor(safeDuration % 60)).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Reaction Distribution by Time */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo de Reação</h3>
        <div className="space-y-4">
          {reactionStats.map((stat) => (
            <div key={stat.reaction_type} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{reactionEmojis[stat.reaction_type]}</span>
                  <span className="font-medium capitalize">
                    {stat.reaction_type === 'love' ? 'Amei' :
                     stat.reaction_type === 'like' ? 'Gostei' :
                     stat.reaction_type === 'dislike' ? 'Não gostei' : 'Descontente'}
                  </span>
                  <span className="text-sm text-gray-600">({stat.count} reações)</span>
                </div>
              </div>
              
              {/* Timeline for this reaction type */}
              <div className="flex space-x-1 h-8">
                {segmentCounts.map((segment, index) => {
                  const count = segment[stat.reaction_type]
                  const opacity = count > 0 ? Math.min(count / 3, 1) : 0 // Max opacity at 3+ reactions
                  const timeInSong = index * segmentDuration
                  const timeLabel = `${Math.floor(timeInSong / 60)}:${Math.floor(timeInSong % 60).toString().padStart(2, '0')}`
                  
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-sm transition-all cursor-pointer"
                      style={{
                        backgroundColor: reactionColors[stat.reaction_type],
                        opacity: opacity
                      }}
                      title={count > 0 ? `${timeLabel} - ${count} reação(ões)` : `${timeLabel} - sem reações`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="text-sm text-gray-600">
        <p><strong>Como ler os gráficos:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>A altura das barras no primeiro gráfico representa a quantidade total de reações</li>
          <li>A intensidade das cores nos gráficos por tipo mostra a concentração de cada reação</li>
          <li>Passe o mouse sobre as barras para ver detalhes específicos</li>
        </ul>
      </div>
    </div>
  )
}