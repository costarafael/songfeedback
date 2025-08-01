# Feedback Song - Projeto de Reações Musicais

## Visão Geral
Aplicação web para coletar feedback de usuários através de reações (emojis) durante a reprodução de músicas com visualização de waveform.

## Funcionalidades
- **Player de Áudio**: Waveform visual + controles play/pause + navegação por clique
- **Sistema de Reacts**: 4 emojis (❤️ love, 👍 like, 👎 dislike, 😠 angry)
- **Módulo Admin**: Upload de músicas + estatísticas detalhadas
- **Analytics**: Coleta de timestamps de reações + contagem de ouvintes

## Stack Tecnológica
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Audio**: WaveSurfer.js para waveform e player
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Configuração do Supabase
- **URL**: https://sosmwuvshpxyhylzsiis.supabase.co
- **Publishable Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvc213dXZzaHB4eWh5bHpzaWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MDU4NjMsImV4cCI6MjA1MTE4MTg2M30.sb_publishable_nURVjIyUMclbdFZmeifBww_BTOgbz0V
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvc213dXZzaHB4eWh5bHpzaWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYwNTg2MywiZXhwIjoyMDUxMTgxODYzfQ.sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV
- **Database Password**: songfeedback
- **Connection String**: postgresql://postgres:songfeedback@db.sosmwuvshpxyhylzsiis.supabase.co:5432/postgres
- **JWT Secret**: super-secret-jwt-token-with-at-least-32-characters-long

## Estrutura do Banco de Dados

### Tabelas:
```sql
-- Músicas
songs (
  id: uuid PRIMARY KEY,
  title: text NOT NULL,
  artist: text,
  file_url: text NOT NULL,
  duration: integer,
  upload_date: timestamp DEFAULT now(),
  listen_count: integer DEFAULT 0,
  -- Campos para transcrição ElevenLabs
  transcription_status: text DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  transcribed_text: text,
  transcription_data: jsonb, -- Dados completos da API ElevenLabs com timestamps
  transcription_language: text,
  transcription_confidence: real,
  transcription_job_id: text,
  transcribed_at: timestamp
)

-- Reações dos usuários  
reactions (
  id: uuid PRIMARY KEY,
  song_id: uuid REFERENCES songs(id),
  reaction_type: text CHECK (reaction_type IN ('love', 'like', 'dislike', 'angry')),
  timestamp: real NOT NULL,
  session_id: text,
  created_at: timestamp DEFAULT now()
)

-- Sessões de escuta
listening_sessions (
  id: uuid PRIMARY KEY,
  song_id: uuid REFERENCES songs(id),
  session_id: text NOT NULL,
  started_at: timestamp DEFAULT now(),
  completed: boolean DEFAULT false
)
```

## Estrutura de Arquivos
```
src/
├── app/
│   ├── page.tsx                    # Lista de músicas
│   ├── player/[id]/page.tsx        # Player com reacts
│   ├── admin/
│   │   ├── page.tsx               # Upload e listagem
│   │   └── stats/[id]/page.tsx    # Estatísticas por música
│   ├── api/
│   │   ├── setup/route.ts         # Setup do banco
│   │   ├── upload/route.ts        # Upload de arquivos
│   │   └── update-duration/route.ts
│   ├── setup/page.tsx             # Página de configuração
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Player/
│   │   └── WaveSurferPlayer.tsx   # Player com waveform
│   ├── ReactButtons/
│   │   └── ReactionButtons.tsx    # Botões de emoji
│   ├── Admin/
│   │   ├── UploadForm.tsx         # Formulário upload
│   │   └── StatsCharts.tsx        # Gráficos estatísticas
│   └── ThemeToggle.tsx            # Toggle tema
├── lib/
│   ├── supabase.ts                # Cliente Supabase
│   ├── types.ts                   # TypeScript types
│   ├── database-setup.sql         # Script SQL setup
│   └── setup-database.ts          # Configuração BD
└── hooks/
    ├── useTheme.ts                # Hook tema
    └── useWaveSurfer.ts           # Hook WaveSurfer
```

## Comandos Importantes
- `npm run dev` - Iniciar desenvolvimento
- `npm run build` - Build de produção
- `npm run lint` - Verificar código
- `npm run type-check` - Verificar tipos TypeScript

## Regras de Negócio
- Sem autenticação em nenhum módulo
- Reacts são registrados com timestamp preciso
- Session ID único por sessão de escuta
- Admin pode upload músicas WAV/MP3
- Estatísticas mostram heatmap de reações no waveform

## URLs da Aplicação
- `/` - Home com lista de músicas
- `/player/[song-id]` - Player com sistema de reacts
- `/admin` - Upload e listagem de músicas
- `/admin/stats/[song-id]` - Estatísticas detalhadas por música
- `/setup` - Página de configuração inicial do banco de dados

## APIs Disponíveis
- `POST /api/setup` - Configuração inicial do banco de dados
- `POST /api/upload` - Upload de arquivos de música
- `POST /api/update-duration` - Atualização da duração da música
- `POST /api/transcribe` - Transcrição de música usando ElevenLabs API

## Configuração ElevenLabs
- **API Key**: sk_2ca0e00e81f8e3a5455f8854874b7f16bbfb71c66a8956d6
- **Endpoint**: https://api.elevenlabs.io/v1/speech-to-text

## Dependências Principais
- **Next.js 15.4.5** - Framework React
- **@supabase/supabase-js ^2.39.7** - Cliente Supabase
- **wavesurfer.js ^7.7.5** - Visualização waveform
- **lucide-react ^0.263.1** - Ícones
- **pg ^8.16.3** - Driver PostgreSQL