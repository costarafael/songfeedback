import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sosmwuvshpxyhylzsiis.supabase.co'
const supabaseServiceKey = 'sb_secret_Px9FtbfQ3oAoVZ4IZupnlg_P_JhFOJV'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  try {
    console.log('Adicionando colunas de metadados...')
    
    // Test if columns already exist by trying to select them
    const { data, error: testError } = await supabaseAdmin
      .from('songs')
      .select('cover_image_url, album, year, genre, metadata')
      .limit(1)
    
    if (!testError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Metadata columns already exist' 
      })
    }

    console.log('Columns do not exist, need to add them manually in Supabase')
    
    return NextResponse.json({ 
      success: false, 
      message: 'Please run these SQL commands in Supabase SQL Editor:',
      sql: [
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS cover_image_url TEXT;',
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS cover_image_key TEXT;', 
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS album TEXT;',
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS year INTEGER;',
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT;',
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS metadata JSONB;',
        'ALTER TABLE songs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
      ]
    })

  } catch (error) {
    console.error('Error checking/adding metadata columns:', error)
    return NextResponse.json(
      { error: 'Failed to check metadata columns' },
      { status: 500 }
    )
  }
}