import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nURVjIyUMclbdFZmeifBww.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV' // Service role key for admin operations

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function setupDatabase() {
  try {
    console.log('Setting up database tables...')

    // Create songs table
    const { error: songsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS songs (
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

    if (songsError) {
      console.error('Error creating songs table:', songsError)
    } else {
      console.log('Songs table created successfully')
    }

    // Create reactions table
    const { error: reactionsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS reactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
          reaction_type TEXT CHECK (reaction_type IN ('love', 'like', 'dislike', 'angry')) NOT NULL,
          timestamp REAL NOT NULL,
          session_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (reactionsError) {
      console.error('Error creating reactions table:', reactionsError)
    } else {
      console.log('Reactions table created successfully')
    }

    // Create listening_sessions table
    const { error: sessionsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS listening_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
          session_id TEXT NOT NULL,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed BOOLEAN DEFAULT FALSE
        );
      `
    })

    if (sessionsError) {
      console.error('Error creating listening_sessions table:', sessionsError)
    } else {
      console.log('Listening sessions table created successfully')
    }

    // Create indexes
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS reactions_song_id_idx ON reactions(song_id);
        CREATE INDEX IF NOT EXISTS reactions_timestamp_idx ON reactions(timestamp);
        CREATE INDEX IF NOT EXISTS listening_sessions_song_id_idx ON listening_sessions(song_id);
      `
    })

    if (indexError) {
      console.error('Error creating indexes:', indexError)
    } else {
      console.log('Indexes created successfully')
    }

    // Disable RLS for simplicity
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
        ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
        ALTER TABLE listening_sessions DISABLE ROW LEVEL SECURITY;
      `
    })

    if (rlsError) {
      console.error('Error disabling RLS:', rlsError)
    } else {
      console.log('RLS disabled successfully')
    }

    console.log('Database setup completed!')
    return { success: true }

  } catch (error) {
    console.error('Database setup failed:', error)
    return { success: false, error }
  }
}

export async function setupStorage() {
  try {
    console.log('Setting up storage bucket...')

    // Create songs bucket
    const { error: bucketError } = await supabaseAdmin.storage.createBucket('songs', {
      public: true,
      allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating storage bucket:', bucketError)
      return { success: false, error: bucketError }
    } else {
      console.log('Storage bucket created/verified successfully')
    }

    return { success: true }

  } catch (error) {
    console.error('Storage setup failed:', error)
    return { success: false, error }
  }
}