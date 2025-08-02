# Feedback Song - Projeto de Reações Musicais

## Visão Geral
Aplicação web para coletar feedback de usuários através de reações (emojis) durante a reprodução de músicas com visualização de waveform.

## Funcionalidades Principais
- **Player de Áudio**: Waveform visual + controles play/pause + navegação por clique
- **Sistema de Reacts**: 4 emojis (❤️ love, 👍 like, 👎 dislike, 😠 angry)
- **Módulo Admin Completo**: Interface profissional com Ant Design
  - Dashboard com estatísticas gerais
  - Upload de músicas com Supabase Storage
  - Gestão de músicas (CRUD completo)
  - Gestão de playlists com ordenação visual
  - Estatísticas detalhadas por música
- **Sistema de Playlists**: Criação, edição e compartilhamento público
- **Analytics Avançadas**: 
  - Mapa de calor de reprodução
  - Segmentos mais pulados
  - Timeline de reações
  - Estatísticas de engajamento

## Stack Tecnológica
- **Frontend**: Next.js 15.4.5 + TypeScript + Tailwind CSS
- **UI Framework**: Ant Design (antd) para interface admin
- **Audio**: WaveSurfer.js para waveform e player
- **Database**: Supabase (PostgreSQL) + Storage
- **Icons**: Lucide React + Ant Design Icons
- **Deployment**: Vercel (https://songfeedback-d66h.vercel.app/)

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
-- Músicas (sem campo description)
songs (
  id: uuid PRIMARY KEY,
  title: text NOT NULL,
  artist: text,
  file_key: text NOT NULL,   -- Chave do arquivo no Supabase Storage
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

-- Playlists
playlists (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  description: text,
  share_token: text UNIQUE NOT NULL,  -- Token para compartilhamento público
  created_at: timestamp DEFAULT now()
)

-- Relacionamento Playlist-Músicas (many-to-many com ordenação)
playlist_songs (
  id: uuid PRIMARY KEY,
  playlist_id: uuid REFERENCES playlists(id) ON DELETE CASCADE,
  song_id: uuid REFERENCES songs(id) ON DELETE CASCADE,
  position: integer NOT NULL,  -- Ordem das músicas na playlist
  created_at: timestamp DEFAULT now(),
  UNIQUE(playlist_id, song_id),
  UNIQUE(playlist_id, position)
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
- `/playlist/[token]` - Player de playlist pública (compartilhamento)
- `/admin` - Dashboard admin com visão geral
- `/admin/songs` - Gestão de músicas (CRUD)
- `/admin/playlists` - Gestão de playlists com ordenação
- `/admin/upload` - Upload de músicas
- `/admin/stats` - Estatísticas gerais
- `/admin/stats/[song-id]` - Estatísticas detalhadas por música
- `/setup` - Página de configuração inicial do banco de dados

## APIs Disponíveis

### Songs
- `GET /api/songs` - Listar todas as músicas
- `POST /api/songs` - Criar nova música (após upload)
- `PUT /api/songs` - Atualizar informações da música
- `GET /api/songs/[id]` - Obter música específica
- `GET /api/songs/[id]/analytics` - Analytics de uma música

### Playlists
- `GET /api/playlists` - Listar playlists com músicas
- `POST /api/playlists` - Criar playlist com músicas ordenadas
- `PUT /api/playlists/[id]` - Atualizar playlist e reordenar músicas
- `DELETE /api/playlists/[id]` - Deletar playlist
- `GET /api/playlists/share/[token]` - Obter playlist pública

### Upload & Utils
- `POST /api/upload-url` - Gerar URL assinada para upload no Supabase Storage
- `POST /api/update-duration` - Atualizar duração da música
- `POST /api/transcribe` - Transcrição usando ElevenLabs API
- `POST /api/setup` - Configuração inicial do banco

## Configuração ElevenLabs
- **API Key**: sk_2ca0e00e81f8e3a5455f8854874b7f16bbfb71c66a8956d6
- **Endpoint**: https://api.elevenlabs.io/v1/speech-to-text

## Dependências Principais
- **Next.js 15.4.5** - Framework React
- **@supabase/supabase-js ^2.39.7** - Cliente Supabase
- **antd ^5.22.6** - UI Framework para admin
- **wavesurfer.js ^7.7.5** - Visualização waveform
- **lucide-react ^0.263.1** - Ícones
- **pg ^8.16.3** - Driver PostgreSQL

## Estado Atual (Agosto 2025)
### ✅ Funcionalidades Implementadas
- **Sistema de Upload**: Funcionando com Supabase Storage
- **Gestão de Playlists**: Interface completa com ordenação visual
- **Compartilhamento Público**: Links de playlist funcionais
- **Analytics Completas**: Heatmap, segmentos pulados, timeline
- **Interface Admin**: Dashboard profissional com Ant Design
- **APIs**: Endpoints completos para todas as operações

### 🔧 Configurações Importantes
- **Campo description removido da tabela songs** (não existe no banco)
- **Upload via Supabase Storage** com URLs assinadas
- **Playlists com sistema de posições** para ordenação
- **Tokens únicos** para compartilhamento público
- **Build e deployment** funcionando no Vercel

### 🚀 Deploy
- **Produção**: https://songfeedback-d66h.vercel.app/
- **Admin**: https://songfeedback-d66h.vercel.app/admin