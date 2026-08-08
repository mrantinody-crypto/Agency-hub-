import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project URL + anon key.'
  )
}

function makeBuilder() {
  const chain = {}
  chain.select = () => chain
  chain.order = async () => ({ data: [], error: null })
  chain.eq = async () => ({ data: [], error: null })
  chain.insert = async () => ({ data: [], error: null })
  chain.update = async () => ({ data: [], error: null })
  chain.in = () => chain
  return chain
}

let supabase
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Export a safe stub with in-memory auth + profiles for local dev
  const users = new Map() // email -> { id, email, password }
  const profiles = new Map() // id -> profile object { id, full_name, role }
  let currentSession = null
  const listeners = new Set()

  function notifyAuth(event, session) {
    listeners.forEach((cb) => cb(event, session))
  }

  // Simple seeded users (will be overwritten by seeding below)
  function seedUser({ id, email, password, full_name, role }) {
    users.set(email, { id, email, password })
    profiles.set(id, { id, full_name: full_name || full_name || email.split('@')[0], role: role || 'team' })
  }

  // Provide a builder that can handle basic select/eq/single/insert behavior
  function makeBuilderFor(table) {
    const state = { table, filters: {} }
    const chain = {}
    chain.select = () => chain
    chain.order = () => ({ data: [] })
    chain.in = () => chain
    chain.eq = (field, value) => {
      state.filters[field] = value
      return chain
    }
    chain.single = async () => {
      if (state.table === 'profiles') {
        const id = state.filters.id
        const p = profiles.get(id) || null
        return { data: p, error: null }
      }
      if (state.table === 'projects_public') {
        return { data: [], error: null }
      }
      return { data: null, error: null }
    }
    chain.insert = async (payload) => {
      if (state.table === 'profiles') {
        const p = Array.isArray(payload) ? payload[0] : payload
        profiles.set(p.id, p)
        return { data: [p], error: null }
      }
      return { data: [], error: null }
    }
    return chain
  }

  supabase = {
    from: (table) => makeBuilderFor(table),
    rpc: async () => ({ data: null, error: null }),
    auth: {
      getSession: async () => ({ data: { session: currentSession } }),
      onAuthStateChange: (cb) => {
        listeners.add(cb)
        return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } }
      },
      signOut: async () => {
        currentSession = null
        notifyAuth('SIGNED_OUT', null)
        return { error: null }
      },
      signInWithPassword: async ({ email, password } = {}) => {
        const u = users.get(email)
        if (!u || u.password !== password) return { error: { message: 'Invalid credentials' } }
        currentSession = { user: { id: u.id, email: u.email } }
        notifyAuth('SIGNED_IN', currentSession)
        return { data: { session: currentSession }, error: null }
      },
      signUp: async ({ email, password, options } = {}) => {
        if (users.has(email)) return { error: { message: 'User exists' } }
        const id = `dev-${Math.random().toString(36).slice(2, 9)}`
        users.set(email, { id, email, password })
        const full_name = options?.data?.full_name || email.split('@')[0]
        profiles.set(id, { id, full_name, role: 'team' })
        currentSession = { user: { id, email } }
        notifyAuth('SIGNED_IN', currentSession)
        return { data: { user: { id, email } }, error: null }
      },
    },
    // helpers for test/debug
    __seedUser: seedUser,
    __getUsers: () => Array.from(users.values()),
  }

  // Seed the accounts requested by the user (Abhi and the owner's account)
  // Abhi: abhinavchauhan26@gmail.com / ABHI1234 (team role)
  seedUser({ id: 'u-abhi', email: 'abhinavchauhan26@gmail.com', password: 'ABHI1234', full_name: 'Abhi', role: 'team' })
  // Owner account: antinodyy@gmal.com / NOOR678
  seedUser({ id: 'u-owner', email: 'antinodyy@gmal.com', password: 'NOOR678', full_name: 'Owner', role: 'admin' })
}

export { supabase }
