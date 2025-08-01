# Sistema de Tracking de Partes Ouvidas - Arquitetura

## Objetivo
Rastrear quais partes da música cada usuário efetivamente ouviu durante uma sessão, distinguindo entre:
- Partes ouvidas sequencialmente (reprodução normal)
- Partes "puladas" (navegação no waveform)
- Partes não ouvidas

## Estrutura do Banco de Dados

### Nova Tabela: `listening_segments`
```sql
CREATE TABLE listening_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- FK para listening_sessions
  song_id UUID NOT NULL REFERENCES songs(id),
  start_time DECIMAL NOT NULL, -- Tempo inicial do segmento (segundos)
  end_time DECIMAL NOT NULL,   -- Tempo final do segmento (segundos)
  is_sequential BOOLEAN DEFAULT true, -- Se foi ouvido sequencialmente
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listening_segments_session ON listening_segments(session_id);
CREATE INDEX idx_listening_segments_song ON listening_segments(song_id);
```

### Atualizar Tabela: `listening_sessions` (adicionar campos)
```sql
ALTER TABLE listening_sessions ADD COLUMN 
  total_listened_time DECIMAL DEFAULT 0, -- Tempo total efetivamente ouvido
  completion_percentage DECIMAL DEFAULT 0, -- % da música ouvida
  skip_count INTEGER DEFAULT 0; -- Quantas vezes pulou partes
```

## Arquitetura de Componentes

### 1. Hook: `useListeningTracker`
```typescript
interface ListeningSegment {
  startTime: number
  endTime: number
  isSequential: boolean
}

interface UseListeningTrackerProps {
  sessionId: string
  songId: string
  duration: number
  onSegmentComplete?: (segment: ListeningSegment) => void
}

const useListeningTracker = ({
  sessionId,
  songId, 
  duration,
  onSegmentComplete
}: UseListeningTrackerProps) => {
  // Lógica de tracking
  // Detecta navegação vs reprodução sequencial
  // Gera segmentos quando há mudanças
}
```

### 2. Componente: `ListeningVisualizer`
```typescript
interface ListeningVisualizerProps {
  sessionId: string
  songId: string
  duration: number
  currentTime: number
  segments: ListeningSegment[]
}

// Renderiza overlay no waveform mostrando:
// - Verde: partes ouvidas sequencialmente
// - Amarelo: partes ouvidas após navegação
// - Cinza/Transparente: partes não ouvidas
```

### 3. Service: `ListeningSegmentsService`
```typescript
class ListeningSegmentsService {
  static async saveSegment(segment: ListeningSegment): Promise<void>
  static async getSessionSegments(sessionId: string): Promise<ListeningSegment[]>
  static async getSongAnalytics(songId: string): Promise<SongListeningAnalytics>
  static async updateSessionStats(sessionId: string): Promise<void>
}

interface SongListeningAnalytics {
  totalSessions: number
  averageCompletionRate: number
  mostSkippedSegments: Array<{startTime: number, endTime: number, skipCount: number}>
  mostListenedSegments: Array<{startTime: number, endTime: number, listenCount: number}>
  heatmap: Array<{time: number, intensity: number}> // Para visualização
}
```

## Lógica de Detecção

### Navegação vs Reprodução Sequencial
```typescript
const SEQUENTIAL_THRESHOLD = 2 // segundos
const MIN_SEGMENT_DURATION = 1 // segundo mínimo para considerar

let lastTime = 0
let segmentStart = 0
let isCurrentlySequential = true

function onTimeUpdate(currentTime: number) {
  const timeDiff = Math.abs(currentTime - lastTime)
  
  // Detectar navegação (salto > threshold)
  if (timeDiff > SEQUENTIAL_THRESHOLD) {
    // Finalizar segmento anterior se válido
    if (lastTime - segmentStart >= MIN_SEGMENT_DURATION) {
      saveSegment({
        startTime: segmentStart,
        endTime: lastTime,
        isSequential: isCurrentlySequential
      })
    }
    
    // Iniciar novo segmento
    segmentStart = currentTime
    isCurrentlySequential = false // Navegação detectada
  } else {
    // Reprodução sequencial continua
    isCurrentlySequential = true
  }
  
  lastTime = currentTime
}
```

## Visualização de Cores

### Sistema de Cores para Letras
```typescript
enum SegmentType {
  NOT_HEARD = 'opacity-30 text-gray-400',           // Não ouvido
  SEQUENTIAL = 'opacity-100 text-foreground',       // Ouvido sequencialmente  
  NAVIGATED = 'opacity-75 text-amber-600'           // Ouvido após navegação
}

function getWordStyle(wordTime: number, segments: ListeningSegment[]): string {
  const segment = segments.find(s => 
    wordTime >= s.startTime && wordTime <= s.endTime
  )
  
  if (!segment) return SegmentType.NOT_HEARD
  return segment.isSequential ? SegmentType.SEQUENTIAL : SegmentType.NAVIGATED
}
```

### Sistema de Cores para Waveform
```typescript
// Overlay no waveform com gradiente baseado nos segmentos
function generateWaveformOverlay(segments: ListeningSegment[], duration: number) {
  return segments.map(segment => ({
    start: segment.startTime / duration * 100, // % da posição
    width: (segment.endTime - segment.startTime) / duration * 100,
    color: segment.isSequential ? 'bg-green-400/30' : 'bg-amber-400/30'
  }))
}
```

## API Endpoints

### POST `/api/listening-segments`
```typescript
interface CreateSegmentRequest {
  sessionId: string
  songId: string
  startTime: number
  endTime: number
  isSequential: boolean
}
```

### GET `/api/listening-segments/session/[sessionId]`
```typescript
interface SessionSegmentsResponse {
  segments: ListeningSegment[]
  totalListenedTime: number
  completionPercentage: number
}
```

### GET `/api/songs/[songId]/analytics`
```typescript
interface SongAnalyticsResponse {
  listeningAnalytics: SongListeningAnalytics
  heatmap: Array<{time: number, intensity: number}>
}
```

## Implementação Faseada

### Fase 1: Infraestrutura Base
1. Criar tabela `listening_segments`
2. Implementar `useListeningTracker` hook
3. Integrar no WaveSurferPlayer

### Fase 2: Visualização
1. Implementar cores diferentes nas letras
2. Adicionar overlay no waveform
3. Criar `ListeningVisualizer` component

### Fase 3: Analytics
1. Implementar endpoints de analytics
2. Dashboard de estatísticas por música
3. Relatórios de engajamento

## Considerações de Performance

- Batchear salvamento de segmentos (a cada 5-10 segundos)
- Usar debounce para evitar muitas calls de API
- Índices apropriados no banco para queries de analytics
- Cache de analytics mais pesadas

## Métricas Importantes

- **Completion Rate**: % da música efetivamente ouvida
- **Skip Rate**: Quantas vezes partes foram puladas
- **Engagement Score**: Baseado em tempo ouvido + reações
- **Attention Span**: Tempo médio antes de navegação
- **Hot Spots**: Partes mais ouvidas/puladas da música

Esta arquitetura permite tanto análise individual quanto agregada do comportamento de escuta dos usuários.