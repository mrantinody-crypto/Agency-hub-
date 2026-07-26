import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import BrandWorkspace from '../components/BrandWorkspace'
import StatusDot from '../components/StatusDot'

// Shared by Designers (canEdit) and Clients (read-only) — each only ever sees
// the brands an admin has explicitly given them access to.
export default function MemberDashboard() {
  const { profile, user, signOut, isTeam } = useAuth()
  const [clients, setClients] = useState([])
  const [view, setView] = useState('today')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('client_members').select('clients(*)').eq('user_id', user.id)
      const list = (data || []).map((r) => r.clients).filter(Boolean)
      setClients(list)
      setLoading(false)
    }
    if (user) load()
  }, [user])

  const selected = clients.find((c) => c.id === view)

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-72 bg-sidebar border-r border-hairline flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-hairline">
          <div className="traffic-lights mb-3">
            <span className="traffic-dot bg-traffic-red" />
            <span className="traffic-dot bg-traffic-yellow" />
            <span className="traffic-dot bg-traffic-green" />
          </div>
          <p className="text-[13px] font-medium text-ink-primary">{profile?.full_name || 'Welcome'}</p>
          <p className="label-caps mt-0.5">{isTeam ? 'Designer' : 'Client'}</p>
        </div>

        <nav className="px-3 py-3">
          <SidebarItem active={view === 'today'} onClick={() => setView('today')} label="Today" icon="☀️" />
        </nav>

        <div className="px-5 pt-3 pb-1">
          <p className="label-caps">Brands</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setView(c.id)}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between mb-0.5 transition-colors ${
                view === c.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'
              }`}
            >
              <span className="text-ink-primary text-[13px]">{c.name}</span>
              <StatusDot status={c.status} />
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-hairline">
          <button onClick={signOut} className="w-full text-[13px] text-ink-secondary hover:text-ink-primary py-1">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <p className="text-ink-secondary text-[13px]">Loading your workspace…</p>
        ) : clients.length === 0 && view === 'today' ? (
          <div className="border border-dashed border-hairline rounded-card py-16 text-center max-w-lg">
            <p className="text-ink-primary text-[14px]">No brands linked to your account yet.</p>
            <p className="text-ink-secondary text-[13px] mt-1">Ask your agency contact to grant you access.</p>
          </div>
        ) : view === 'today' ? (
          <MyToday clients={clients} userId={user.id} />
        ) : selected ? (
          <BrandWorkspace client={selected} canEdit={isTeam} />
        ) : null}
      </main>
    </div>
  )
}

function SidebarItem({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-md flex items-center gap-2.5 text-[13px] transition-colors ${
        active ? 'bg-white shadow-sm text-ink-primary font-medium' : 'text-ink-secondary hover:bg-white/60'
      }`}
    >
      <span>{icon}</span>{label}
    </button>
  )
}

function MyToday({ clients, userId }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      const ids = clients.map((c) => c.id)
      if (ids.length === 0) { setLoading(false); return }
      const { data } = await supabase
        .from('tasks')
        .select('*, clients(name)')
        .in('client_id', ids)
        .order('due_date', { ascending: true, nullsFirst: false })
      setTasks(data || [])
      setLoading(false)
    }
    load()
  }, [clients])

  const mine = tasks.filter((t) => t.assigned_to === userId)
  const open = mine.filter((t) => t.status !== 'done')
  const done = mine.filter((t) => t.status === 'done').slice(0, 8)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink-primary">Today</h1>
        <p className="text-ink-secondary text-[13px] mt-0.5">
          {clients.length} brand{clients.length === 1 ? '' : 's'} · {open.length} open for you
        </p>
      </div>

      {loading ? (
        <p className="text-ink-secondary text-[13px]">Loading…</p>
      ) : (
        <>
          <TaskGroup title="Pending / in progress" items={open} tone="yellow" />
          <TaskGroup title="Recently completed" items={done} tone="green" />
        </>
      )}
    </div>
  )
}

function TaskGroup({ title, items, tone }) {
  const dot = { red: 'bg-traffic-red', yellow: 'bg-traffic-yellow', green: 'bg-traffic-green' }[tone]
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`traffic-dot ${dot}`} />
        <p className="label-caps">{title} ({items.length})</p>
      </div>
      {items.length === 0 ? (
        <p className="text-ink-tertiary text-[13px] px-1">Nothing here.</p>
      ) : (
        <div className="mac-window divide-y divide-hairline">
          {items.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-ink-primary text-[14px]">{t.title}</p>
                <p className="text-ink-tertiary text-[12px]">{t.clients?.name} {t.due_date ? `· due ${t.due_date}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
