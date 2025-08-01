import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    // Execute each SQL statement separately
    const statements = [
      // Create playlists table
      `CREATE TABLE IF NOT EXISTS playlists (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        share_token VARCHAR(32) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create playlist_songs table
      `CREATE TABLE IF NOT EXISTS playlist_songs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        playlist_id UUID NOT NULL,
        song_id UUID NOT NULL,
        position INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Add foreign key constraints separately if they don't exist
      `DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'playlist_songs_playlist_id_fkey'
        ) THEN
          ALTER TABLE playlist_songs 
          ADD CONSTRAINT playlist_songs_playlist_id_fkey 
          FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE;
        END IF;
      END $$`,
      
      `DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'playlist_songs_song_id_fkey'
        ) THEN
          ALTER TABLE playlist_songs 
          ADD CONSTRAINT playlist_songs_song_id_fkey 
          FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE;
        END IF;
      END $$`,
      
      // Add unique constraints
      `DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'playlist_songs_playlist_id_song_id_key'
        ) THEN
          ALTER TABLE playlist_songs 
          ADD CONSTRAINT playlist_songs_playlist_id_song_id_key 
          UNIQUE(playlist_id, song_id);
        END IF;
      END $$`,
      
      `DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'playlist_songs_playlist_id_position_key'
        ) THEN
          ALTER TABLE playlist_songs 
          ADD CONSTRAINT playlist_songs_playlist_id_position_key 
          UNIQUE(playlist_id, position);
        END IF;
      END $$`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id)`,
      `CREATE INDEX IF NOT EXISTS idx_playlist_songs_position ON playlist_songs(playlist_id, position)`,
      `CREATE INDEX IF NOT EXISTS idx_playlists_share_token ON playlists(share_token)`
    ]

    for (const statement of statements) {
      const { error } = await supabaseAdmin.from('').select().limit(0) // Dummy query to test connection
      if (error) {
        console.log('Connection error, trying direct SQL execution')
      }
      
      // Try using the SQL editor approach
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: statement })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SQL execution error:', errorText)
        // Continue with next statement instead of failing
      } else {
        console.log('SQL executed successfully:', statement.substring(0, 50) + '...')
      }
    }

    // Test if tables were created by trying to select from them
    const { error: testError } = await supabaseAdmin
      .from('playlists')
      .select('id')
      .limit(1)

    if (testError) {
      return NextResponse.json(
        { error: 'Tabelas não foram criadas corretamente. Execute o SQL manualmente no Supabase: ' + testError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tabelas de playlist criadas com sucesso!' 
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Erro na migração. Execute o SQL manualmente no Supabase.' },
      { status: 500 }
    )
  }
}