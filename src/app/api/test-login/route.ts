import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 })
    }

    const supabase = createClient()
    
    console.log('🔐 Testando login via API:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return NextResponse.json({
      success: !error,
      user_id: data.user?.id || null,
      user_email: data.user?.email || null,
      error: error?.message || null,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Erro no servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}