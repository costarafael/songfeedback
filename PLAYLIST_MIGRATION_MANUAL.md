# Migração Manual das Tabelas de Playlist

Execute este SQL no **SQL Editor** do Supabase Dashboard:

## 1. Criar Tabela de Playlists

```sql
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  share_token VARCHAR(32) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Criar Tabela de Músicas da Playlist

```sql
CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL,
  song_id UUID NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Adicionar Constraints de Chave Estrangeira

```sql
-- Referência para playlists
ALTER TABLE playlist_songs 
ADD CONSTRAINT playlist_songs_playlist_id_fkey 
FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE;

-- Referência para songs
ALTER TABLE playlist_songs 
ADD CONSTRAINT playlist_songs_song_id_fkey 
FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;
```

## 4. Adicionar Constraints de Unicidade

```sql
-- Não permitir música duplicada na mesma playlist
ALTER TABLE playlist_songs 
ADD CONSTRAINT playlist_songs_playlist_id_song_id_key 
UNIQUE(playlist_id, song_id);

-- Não permitir mesma posição na mesma playlist
ALTER TABLE playlist_songs 
ADD CONSTRAINT playlist_songs_playlist_id_position_key 
UNIQUE(playlist_id, position);
```

## 5. Criar Índices para Performance

```sql
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_position ON playlist_songs(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlists_share_token ON playlists(share_token);
```

## 6. Trigger para Updated_At (Opcional)

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para playlists
CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Como Executar:

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Cole e execute cada bloco SQL acima **um por vez**
4. Após executar todos, teste criando uma playlist no admin

## Verificação:

Para verificar se as tabelas foram criadas corretamente:

```sql
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('playlists', 'playlist_songs');

-- Verificar estrutura da tabela playlists
\d playlists;

-- Verificar estrutura da tabela playlist_songs
\d playlist_songs;
```