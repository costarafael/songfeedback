import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
    supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING',
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'MISSING',
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}