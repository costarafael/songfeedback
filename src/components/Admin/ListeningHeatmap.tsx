'use client'

interface HeatmapPoint {
  time: number
  intensity: number
  listenCount: number
}

interface ListeningHeatmapProps {
  heatmap: HeatmapPoint[]
  duration: number
  title?: string
}

export default function ListeningHeatmap({ heatmap, duration, title = "Mapa de Calor de Escuta" }: ListeningHeatmapProps) {
  if (!heatmap || heatmap.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Dados insuficientes para gerar mapa de calor
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-200'
    if (intensity <= 0.2) return 'bg-blue-200'
    if (intensity <= 0.4) return 'bg-blue-300'
    if (intensity <= 0.6) return 'bg-blue-400'
    if (intensity <= 0.8) return 'bg-blue-500'
    return 'bg-blue-600'
  }

  const getIntensityLabel = (intensity: number) => {
    if (intensity === 0) return 'Não ouvido'
    if (intensity <= 0.2) return 'Pouco ouvido'
    if (intensity <= 0.4) return 'Moderadamente ouvido'
    if (intensity <= 0.6) return 'Bem ouvido'
    if (intensity <= 0.8) return 'Muito ouvido'
    return 'Extremamente ouvido'
  }

  // Debug logging
  console.log('ListeningHeatmap - Debug:', {
    duration,
    heatmapLength: heatmap.length,
    firstPoint: heatmap[0],
    lastPoint: heatmap[heatmap.length - 1]
  })

  // Calcular estatísticas
  const totalListens = heatmap.reduce((sum, point) => sum + point.listenCount, 0)
  const avgIntensity = heatmap.reduce((sum, point) => sum + point.intensity, 0) / heatmap.length
  const maxListens = Math.max(...heatmap.map(p => p.listenCount))
  const mostListenedPoint = heatmap.find(p => p.listenCount === maxListens)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      
      {/* Estatísticas resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalListens}</div>
          <div className="text-sm text-gray-600">Total de Reproduções</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{Math.round(avgIntensity * 100)}%</div>
          <div className="text-sm text-gray-600">Intensidade Média</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {mostListenedPoint ? formatTime(mostListenedPoint.time) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Momento Mais Ouvido</div>
        </div>
      </div>

      {/* Heatmap visual */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">0:00</span>
          <span className="text-sm text-gray-600">{formatTime(duration)}</span>
        </div>
        
        <div className="h-16 rounded-lg overflow-hidden border border-gray-200 flex">
          {heatmap.map((point, index) => (
            <div
              key={index}
              className={`flex-1 ${getIntensityColor(point.intensity)} transition-all duration-200 hover:opacity-80 cursor-pointer group relative`}
              title={`${formatTime(point.time)}: ${point.listenCount} reproduções (${getIntensityLabel(point.intensity)})`}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div>{formatTime(point.time)}</div>
                <div>{point.listenCount} plays</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Intensidade de Escuta:</div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Não ouvido</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span>Pouco</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span>Moderado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span>Muito</span>
          </div>
        </div>
      </div>

      {/* Análise de engagement */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">Análise de Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Partes mais ouvidas:</span>
            <div className="ml-2 text-gray-600">
              {heatmap
                .filter(p => p.intensity > 0.7)
                .slice(0, 3)
                .map(p => formatTime(p.time))
                .join(', ') || 'Nenhuma identificada'}
            </div>
          </div>
          <div>
            <span className="font-medium">Partes menos ouvidas:</span>
            <div className="ml-2 text-gray-600">
              {heatmap
                .filter(p => p.intensity < 0.3 && p.intensity > 0)
                .slice(0, 3)
                .map(p => formatTime(p.time))
                .join(', ') || 'Nenhuma identificada'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}