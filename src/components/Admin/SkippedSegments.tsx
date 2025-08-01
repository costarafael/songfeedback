'use client'

interface SkippedSegment {
  startTime: number
  endTime: number
  skipCount: number
  listenCount: number
}

interface SkippedSegmentsProps {
  segments: SkippedSegment[]
  title?: string
}

export default function SkippedSegments({ segments, title = "Segmentos Mais Pulados" }: SkippedSegmentsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSkipRate = (segment: SkippedSegment) => {
    const total = segment.skipCount + segment.listenCount
    return total > 0 ? Math.round((segment.skipCount / total) * 100) : 0
  }

  const getSkipSeverity = (skipRate: number) => {
    if (skipRate >= 80) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Crítico' }
    if (skipRate >= 60) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Alto' }
    if (skipRate >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Médio' }
    return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Baixo' }
  }

  if (!segments || segments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg mb-2">🎉 Excelente!</div>
          <div>Nenhum segmento foi pulado com frequência</div>
        </div>
      </div>
    )
  }

  const totalSkips = segments.reduce((sum, seg) => sum + seg.skipCount, 0)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      
      {/* Resumo */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-red-600">{totalSkips}</div>
            <div className="text-sm text-gray-600">Total de Pulos</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-700">{segments.length}</div>
            <div className="text-sm text-gray-600">Segmentos Problemáticos</div>
          </div>
        </div>
      </div>

      {/* Lista de segmentos */}
      <div className="space-y-4">
        {segments.map((segment, index) => {
          const skipRate = getSkipRate(segment)
          const severity = getSkipSeverity(skipRate)
          
          return (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-700">
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${severity.bg} ${severity.color}`}>
                    {severity.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-600">{skipRate}%</div>
                  <div className="text-xs text-gray-500">taxa de pulo</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex space-x-4">
                  <span>
                    <span className="font-medium text-red-600">{segment.skipCount}</span> pulos
                  </span>
                  <span>
                    <span className="font-medium text-green-600">{segment.listenCount}</span> reproduções
                  </span>
                </div>
                <div className="text-xs">
                  Duração: {Math.round(segment.endTime - segment.startTime)}s
                </div>
              </div>
              
              {/* Barra de progresso visual */}
              <div className="mt-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                  <span>Pulos</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-red-400 transition-all duration-300"
                      style={{ width: `${skipRate}%` }}
                    ></div>
                  </div>
                  <span>Reproduções</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dicas de melhoria */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">💡 Dicas para Melhoria</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Segmentos com alta taxa de pulo podem indicar partes menos envolventes</div>
          <div>• Considere analisar a estrutura musical desses trechos</div>
          <div>• Verifique se há transições bruscas ou mudanças de ritmo</div>
        </div>
      </div>
    </div>
  )
}