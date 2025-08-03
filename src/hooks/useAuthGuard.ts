'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-auth'
import type { User } from '@supabase/supabase-js'

export function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error || !currentUser) {
          // Not authenticated, redirect to login
          router.push('/admin/login')
          return
        }
        
        setUser(currentUser)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          router.push('/admin/login')
        } else if (session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [router, supabase.auth])

  return { user, loading, authenticated: !!user }
}