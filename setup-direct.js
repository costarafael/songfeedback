const { Client } = require('pg')

const connectionString = 'postgresql://postgres:songfeedback@db.sosmwuvshpxyhylzsiis.supabase.co:5432/postgres'

async function setupDatabase() {
  const client = new Client({ connectionString })
  
  try {
    console.log('🚀 Conectando ao PostgreSQL...')
    await client.connect()
    console.log('✅ Conectado com sucesso!')

    // Criar tabela songs
    console.log('📝 Criando tabela songs...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        artist TEXT,
        file_url TEXT NOT NULL,
        duration INTEGER,
        upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        listen_count INTEGER DEFAULT 0
      );
    `)
    console.log('✅ Tabela songs criada')

    // Criar tabela reactions  
    console.log('📝 Criando tabela reactions...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        reaction_type TEXT CHECK (reaction_type IN ('love', 'like', 'dislike', 'angry')) NOT NULL,
        timestamp REAL NOT NULL,
        session_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    console.log('✅ Tabela reactions criada')

    // Criar tabela listening_sessions
    console.log('📝 Criando tabela listening_sessions...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS listening_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed BOOLEAN DEFAULT FALSE
      );
    `)
    console.log('✅ Tabela listening_sessions criada')

    // Criar índices
    console.log('📝 Criando índices...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS reactions_song_id_idx ON reactions(song_id);
      CREATE INDEX IF NOT EXISTS reactions_timestamp_idx ON reactions(timestamp);
      CREATE INDEX IF NOT EXISTS listening_sessions_song_id_idx ON listening_sessions(song_id);
    `)
    console.log('✅ Índices criados')

    // Desabilitar RLS para simplicidade
    console.log('🔓 Desabilitando RLS...')
    await client.query(`
      ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
      ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE listening_sessions DISABLE ROW LEVEL SECURITY;
    `)
    console.log('✅ RLS desabilitado')

    console.log('🎉 Setup do banco concluído com sucesso!')

  } catch (error) {
    console.error('❌ Erro no setup:', error.message)
  } finally {
    await client.end()
  }
}

setupDatabase()