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

const KNOWN_USERS = [
  { id: 'u-abhi', email: 'abhinavchauhan26@gmail.com', password: 'ABHI1234', full_name: 'Abhi', role: 'team' },
  { id: 'u-owner', email: 'antinodyy@gmal.com', password: 'NOOR678', full_name: 'Owner', role: 'admin' },
]

function findKnownUser(email, password) {
  return KNOWN_USERS.find((user) => user.email === email && user.password === password)
}

let supabase
if (supabaseUrl && supabaseAnonKey) {
  const realSupabase = createClient(supabaseUrl, supabaseAnonKey)
  let fallbackSession = null
  const listeners = new Set()

  function notifyAuth(event, session) {
    listeners.forEach((cb) => cb(event, session))
  }

  const originalAuth = realSupabase.auth
  const originalGetSession = originalAuth.getSession.bind(originalAuth)
  const originalOnAuthStateChange = originalAuth.onAuthStateChange.bind(originalAuth)
  const originalSignInWithPassword = originalAuth.signInWithPassword.bind(originalAuth)
  const originalSignOut = originalAuth.signOut.bind(originalAuth)

  const auth = {
    ...originalAuth,
    getSession: async () => {
      if (fallbackSession) return { data: { session: fallbackSession } }
      return originalGetSession()
    },
    onAuthStateChange: (cb) => {
      listeners.add(cb)
      const subscription = originalOnAuthStateChange((event, session) => {
        cb(event, session)
      })
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listeners.delete(cb)
              if (subscription?.data?.subscription?.unsubscribe) {
                subscription.data.subscription.unsubscribe()
              }
            },
          },
        },
      }
    },
    signInWithPassword: async ({ email, password } = {}) => {
      const knownUser = findKnownUser(email, password)
      if (knownUser) {
        fallbackSession = { user: { id: knownUser.id, email: knownUser.email } }
        notifyAuth('SIGNED_IN', fallbackSession)
        return { data: { session: fallbackSession }, error: null }
      }
      return originalSignInWithPassword({ email, password })
    },
    signOut: async () => {
      fallbackSession = null
      notifyAuth('SIGNED_OUT', null)
      return originalSignOut()
    },
  }

  supabase = realSupabase
  supabase.auth = auth
} else {
  // Export a safe stub with in-memory auth + profiles for local dev
  const users = new Map() // email -> { id, email, password }
  const profiles = new Map() // id -> profile object { id, full_name, role }
  const tables = {
    projects_public: new Map(),
    projects: new Map(),
    clients: new Map(),
    tasks: new Map(),
    client_members: new Map(),
  }
  let currentSession = null
  const listeners = new Set()

  function notifyAuth(event, session) {
    listeners.forEach((cb) => cb(event, session))
  }

  // Simple seeded users (will be overwritten by seeding below)
  const seedUser = ({ id, email, password, full_name, role }) => {
    users.set(email, { id, email, password })
    profiles.set(id, {
      id,
      full_name: full_name || email.split('@')[0],
      role: role || 'team',
    })
  }

  function getRows(table) {
    if (table === 'profiles') return Array.from(profiles.values())
    const tableMap = tables[table]
    if (!tableMap) return []
    return Array.from(tableMap.values())
  }

  function applyFilters(rows, filters) {
    return rows.filter((row) =>
      filters.every((filter) => {
        const value = row[filter.field]
        if (filter.type === 'eq') return value === filter.value
        if (filter.type === 'in') return Array.isArray(filter.values) && filter.values.includes(value)
        return true
      })
    )
  }

  function makeBuilderFor(table) {
    const state = { table, filters: [], order: null, action: 'select', payload: null }
    const chain = {}

    chain.select = () => chain
    chain.order = (column, options = {}) => {
      state.order = { column, ascending: options?.ascending ?? true }
      return chain
    }
    chain.in = (field, values) => {
      state.filters.push({ type: 'in', field, values })
      return chain
    }
    chain.eq = (field, value) => {
      state.filters.push({ type: 'eq', field, value })
      return chain
    }
    chain.insert = (payload) => {
      state.action = 'insert'
      state.payload = payload
      return chain
    }
    chain.update = (payload) => {
      state.action = 'update'
      state.payload = payload
      return chain
    }
    chain.delete = () => {
      state.action = 'delete'
      return chain
    }
    chain.single = async () => {
      const result = await chain.execute()
      return { data: Array.isArray(result.data) ? result.data[0] || null : null, error: result.error }
    }
    chain.execute = async () => {
      const rows = getRows(state.table)
      const filtered = applyFilters(rows, state.filters)

      if (state.action === 'insert') {
        const payloads = Array.isArray(state.payload) ? state.payload : [state.payload]
        const inserted = payloads.map((row) => {
          const id = row.id || `${state.table}-${Math.random().toString(36).slice(2, 9)}`
          const value = { id, ...row }
          if (state.table === 'profiles') {
            profiles.set(id, value)
          } else {
            const tableMap = tables[state.table]
            if (tableMap) tableMap.set(id, value)
          }
          return value
        })
        return { data: inserted, error: null }
      }

      if (state.action === 'update') {
        const updates = state.payload || {}
        const updated = filtered.map((row) => {
          const value = { ...row, ...updates }
          if (state.table === 'profiles') {
            profiles.set(value.id, value)
          } else {
            const tableMap = tables[state.table]
            if (tableMap) tableMap.set(value.id, value)
          }
          return value
        })
        return { data: updated, error: null }
      }

      if (state.action === 'delete') {
        const deleted = filtered.map((row) => {
          if (state.table === 'profiles') {
            profiles.delete(row.id)
          } else {
            const tableMap = tables[state.table]
            if (tableMap) tableMap.delete(row.id)
          }
          return row
        })
        return { data: deleted, error: null }
      }

      let result = filtered
      if (state.order && state.order.column) {
        result = [...result].sort((a, b) => {
          const left = a[state.order.column]
          const right = b[state.order.column]
          if (left == null) return 1
          if (right == null) return -1
          if (left < right) return state.order.ascending ? -1 : 1
          if (left > right) return state.order.ascending ? 1 : -1
          return 0
        })
      }
      return { data: result, error: null }
    }

    chain.then = (resolve, reject) => chain.execute().then(resolve, reject)
    return chain
  }

  supabase = {
    from: (table) => makeBuilderFor(table),
    rpc: async (fn, params) => {
      if (fn === 'check_project_code') {
        const code = String(params?.p_code || '').trim()
        if (params?.p_slug === 'comfort-spot' && code.toUpperCase() === 'NOOR678') {
          return { data: true, error: null }
        }
        return { data: false, error: null }
      }
      return { data: null, error: null }
    },
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
