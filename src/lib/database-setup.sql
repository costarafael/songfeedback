-- Criar tabelas no Supabase
-- Execute no SQL Editor do Supabase

-- Tabela de músicas
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  file_url TEXT NOT NULL,
  duration INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  listen_count INTEGER DEFAULT 0
);

-- Tabela de reações
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('love', 'like', 'dislike', 'angry')) NOT NULL,
  timestamp REAL NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de escuta
CREATE TABLE IF NOT EXISTS listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS reactions_song_id_idx ON reactions(song_id);
CREATE INDEX IF NOT EXISTS reactions_timestamp_idx ON reactions(timestamp);
CREATE INDEX IF NOT EXISTS listening_sessions_song_id_idx ON listening_sessions(song_id);

-- RLS (Row Level Security) - desabilitado para simplicidade
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions DISABLE ROW LEVEL SECURITY;