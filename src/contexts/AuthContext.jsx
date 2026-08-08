import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data || null)
  }

  async function refreshProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data || null)
    return data || null
  }

  useEffect(() => {
    let mounted = true
    let settled = false

    async function initSession() {
      console.debug('AuthContext: starting session initialization')
      const timeout = window.setTimeout(() => {
        if (!settled && mounted) {
          settled = true
          console.warn('Auth session check timed out after 5 seconds; falling back to unauthenticated state.')
          setSession(null)
          setProfile(null)
          setLoading(false)
        }
      }, 5000)

      try {
        const result = await supabase.auth.getSession()
        console.debug('AuthContext getSession result:', result)
        const session = result?.data?.session || null
        if (!mounted) return
        setSession(session)
        if (session?.user) await loadProfile(session.user.id)
      } catch (error) {
        console.warn('Failed to load auth session:', error)
        if (!mounted) return
        setSession(null)
        setProfile(null)
      } finally {
        if (mounted && !settled) {
          settled = true
          window.clearTimeout(timeout)
          setLoading(false)
        }
      }
    }

    initSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.debug('Auth state changed:', _event, session)
      setSession(session)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isTeam: profile?.role === 'team',
    isClient: profile?.role === 'client',
    signOut: () => supabase.auth.signOut().then(() => {
      window.location.assign('/agency-hub/login')
    }),
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
