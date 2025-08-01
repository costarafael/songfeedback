import { NextResponse } from 'next/server'
import { setupDatabase, setupStorage } from '@/lib/setup-database'

export async function POST() {
  try {
    console.log('Starting Supabase setup...')

    // Setup database tables
    const dbResult = await setupDatabase()
    if (!dbResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database setup failed',
        details: dbResult.error 
      }, { status: 500 })
    }

    // Setup storage bucket
    const storageResult = await setupStorage()
    if (!storageResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: 'Storage setup failed',
        details: storageResult.error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase setup completed successfully!' 
    })

  } catch (error) {
    console.error('Setup API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Setup failed',
      details: error 
    }, { status: 500 })
  }
}