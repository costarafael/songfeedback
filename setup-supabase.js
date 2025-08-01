const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nURVjIyUMclbdFZmeifBww.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados Supabase...')

  try {
    // Criar tabela songs
    console.log('📝 Criando tabela songs...')
    const { error: songsError } = await supabase
      .from('songs')
      .select('id')
      .limit(1)

    if (songsError && songsError.code === 'PGRST116') {
      // Tabela não existe, criar via SQL direto
      const { error } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE songs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            artist TEXT,
            file_url TEXT NOT NULL,
            duration INTEGER,
            upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            listen_count INTEGER DEFAULT 0
          );
        `
      })
      
      if (error) {
        console.error('❌ Erro ao criar tabela songs:', error)
      } else {
        console.log('✅ Tabela songs criada')
      }
    } else {
      console.log('✅ Tabela songs já existe')
    }

    // Criar tabela reactions
    console.log('📝 Criando tabela reactions...')
    const { error: reactionsError } = await supabase
      .from('reactions')
      .select('id')
      .limit(1)

    if (reactionsError && reactionsError.code === 'PGRST116') {
      const { error } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE reactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
            reaction_type TEXT CHECK (reaction_type IN ('love', 'like', 'dislike', 'angry')) NOT NULL,
            timestamp REAL NOT NULL,
            session_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
      
      if (error) {
        console.error('❌ Erro ao criar tabela reactions:', error)
      } else {
        console.log('✅ Tabela reactions criada')
      }
    } else {
      console.log('✅ Tabela reactions já existe')
    }

    // Criar tabela listening_sessions
    console.log('📝 Criando tabela listening_sessions...')
    const { error: sessionsError } = await supabase
      .from('listening_sessions')
      .select('id')
      .limit(1)

    if (sessionsError && sessionsError.code === 'PGRST116') {
      const { error } = await supabase.rpc('exec', {
        sql: `
          CREATE TABLE listening_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
            session_id TEXT NOT NULL,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed BOOLEAN DEFAULT FALSE
          );
        `
      })
      
      if (error) {
        console.error('❌ Erro ao criar tabela listening_sessions:', error)
      } else {
        console.log('✅ Tabela listening_sessions criada')
      }
    } else {
      console.log('✅ Tabela listening_sessions já existe')
    }

    // Criar bucket de storage
    console.log('📁 Configurando storage bucket...')
    const { error: bucketError } = await supabase.storage.createBucket('songs', {
      public: true,
      allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Erro ao criar bucket:', bucketError)
    } else {
      console.log('✅ Storage bucket configurado')
    }

    console.log('🎉 Setup do Supabase concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no setup:', error)
  }
}

// Executar setup
setupDatabase()