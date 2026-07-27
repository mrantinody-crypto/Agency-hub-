import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import BrandWorkspace from '../components/BrandWorkspace'
import StatusDot from '../components/StatusDot'
import AccountPanel from '../components/AccountPanel'
import HomeHeader from '../components/HomeHeader'
import NotificationBell from '../components/NotificationBell'

const PALETTE = ['#0A84FF', '#6C4CE0', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1', '#F97316']

function getBrandColor(name) {
  const seed = String(name || 'brand').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return PALETTE[seed % PALETTE.length]
}

function getDaysRemaining(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  const due = new Date(`${dateStr}T00:00:00`)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((due - start) / 86400000)
}

function formatDueLabel(dateStr) {
  const days = getDaysRemaining(dateStr)
  if (days === null) return 'No due date'
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'In 1 day'
  return `In ${days} days`
}

// Shared by Designers (canEdit) and Clients (read-only) — each only ever sees
// the brands an admin has explicitly given them access to.
export default function MemberDashboard() {
  const { profile, user, signOut, isTeam } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
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

  useEffect(() => {
    async function loadTasks() {
      const ids = clients.map((c) => c.id)
      if (ids.length === 0) return
      const { data } = await supabase
        .from('tasks')
        .select('*, clients(name)')
        .in('client_id', ids)
        .order('due_date', { ascending: true, nullsFirst: false })
      setTasks(data || [])
    }
    if (clients.length > 0) loadTasks()
  }, [clients])

  const selected = clients.find((c) => c.id === view)

  function handleClientUpdated() {
    const load = async () => {
      const { data } = await supabase.from('client_members').select('clients(*)').eq('user_id', user.id)
      const list = (data || []).map((r) => r.clients).filter(Boolean)
      setClients(list)
    }
    if (user) load()
  }

  function handleClientDeleted() {
    setView('today')
    if (user) {
      supabase.from('client_members').select('clients(*)').eq('user_id', user.id).then(({ data }) => {
        const list = (data || []).map((r) => r.clients).filter(Boolean)
        setClients(list)
      })
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-72 bg-sidebar border-r border-hairline flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-hairline">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[20px] leading-tight text-ink-primary">Anti Agency Hub</p>
              <p className="text-[13px] font-medium text-ink-primary mt-1">{profile?.full_name || 'Welcome'}</p>
              <p className="label-caps mt-0.5">{isTeam ? 'Designer' : 'Client'}</p>
            </div>
            <NotificationBell tasks={tasks} />
          </div>
        </div>

        <nav className="px-3 py-3 space-y-0.5">
          <SidebarItem active={view === 'today'} onClick={() => setView('today')} label="Today" icon="☀️" />
          <SidebarItem active={view === 'account'} onClick={() => setView('account')} label="Account" icon="👤" />
        </nav>

        <div className="px-5 pt-3 pb-1">
          <p className="label-caps">Brands</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {clients.map((c) => {
            const accent = getBrandColor(c.name)
            return (
              <button
                key={c.id}
                onClick={() => setView(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between mb-1.5 transition-all border-l-4 ${view === c.id ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
                style={view === c.id ? { borderLeftColor: accent } : { borderLeftColor: 'transparent' }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold text-white shadow-sm" style={{ backgroundColor: accent }}>
                    {c.name?.charAt(0)?.toUpperCase() || 'B'}
                  </span>
                  <span className="text-ink-primary text-[13px]">{c.name}</span>
                </span>
                <StatusDot status={c.status} />
              </button>
            )
          })}
        </div>

        <div className="p-3 border-t border-hairline space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-hairline bg-white/80 dark:bg-[#121212] px-3 py-2 text-[13px] text-ink-secondary transition-shadow hover:shadow-md"
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
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
          <MyToday clients={clients} userId={user.id} tasks={tasks} profileName={profile?.full_name || 'there'} />
        ) : view === 'account' ? (
          <AccountPanel />
        ) : selected ? (
          <BrandWorkspace client={selected} canEdit={isTeam} onClientUpdated={handleClientUpdated} onClientDeleted={handleClientDeleted} />
        ) : null}
      </main>
    </div>
  )
}

function SidebarItem({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-[13px] transition-all ${
        active ? 'bg-white dark:bg-[#121212] shadow-sm text-ink-primary font-medium' : 'text-ink-secondary hover:bg-white/70 dark:hover:bg-[#121212] hover:shadow-sm'
      }`}
    >
      <span>{icon}</span>{label}
    </button>
  )
}

function MyToday({ clients, userId, tasks, profileName }) {
  const [completingIds, setCompletingIds] = useState([])
  const todayStr = new Date().toISOString().slice(0, 10)

  async function completeTask(task) {
    setCompletingIds((prev) => [...prev, task.id])
    await supabase.from('tasks').update({ status: 'done' }).eq('id', task.id)
    window.setTimeout(() => {
      setCompletingIds((prev) => prev.filter((id) => id !== task.id))
      window.location.reload()
    }, 220)
  }

  const mine = tasks.filter((t) => t.assigned_to === userId)
  const overdue = mine.filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayStr)
  const dueToday = mine.filter((t) => t.status !== 'done' && t.due_date === todayStr)
  const upcoming = mine.filter((t) => t.status !== 'done' && t.due_date && t.due_date > todayStr).sort((a, b) => a.due_date.localeCompare(b.due_date))

  const urgentGroups = [...overdue, ...dueToday].reduce((acc, task) => {
    const key = task.clients?.name || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  const urgentEntries = Object.entries(urgentGroups).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="max-w-5xl space-y-4">
      <HomeHeader name={profileName} />

      <div className="rounded-[20px] border border-hairline bg-white/80 p-3.5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="label-caps">Today's Checklist</p>
            <p className="text-[13px] text-ink-secondary mt-1">Your priorities for the day.</p>
          </div>
          <div className="rounded-full bg-sysblue/10 px-2.5 py-1 text-[12px] font-medium text-sysblue">{overdue.length + dueToday.length} active</div>
        </div>

        {urgentEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-3 py-4 text-center text-[13px] text-ink-secondary">
            Nothing urgent today — your queue looks clear.
          </div>
        ) : (
          <div className="space-y-4">
            {urgentEntries.map(([brand, items]) => (
              <div key={brand} className="rounded-2xl border border-hairline bg-canvas/70 p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getBrandColor(brand) }} />
                  <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-ink-secondary">{brand}</p>
                </div>
                <div className="space-y-2">
                  {items.map((task) => {
                    const isCompleting = completingIds.includes(task.id)
                    return (
                      <label key={task.id} className={`flex cursor-pointer items-start gap-2.5 rounded-full border border-hairline bg-white px-2.5 py-2 transition-all ${isCompleting ? 'opacity-60 line-through' : 'hover:border-sysblue/30'}`}>
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-hairline text-sysblue focus:ring-sysblue"
                          onChange={() => completeTask(task)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-ink-primary">{task.title}</p>
                          <p className="mt-1 text-[12px] text-ink-secondary">
                            {task.due_date === todayStr ? 'Due today' : 'Overdue'} · {task.clients?.name || 'Unassigned'}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[20px] border border-hairline bg-white/80 p-3.5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="label-caps">Upcoming Deadlines</p>
            <p className="text-[13px] text-ink-secondary mt-1">Things coming up next.</p>
          </div>
          <div className="rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-medium text-amber-700">{Math.min(upcoming.length, 7)} upcoming</div>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-3 py-4 text-center text-[13px] text-ink-secondary">
            No nearby deadlines from your assignments.
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 7).map((task) => {
              const days = getDaysRemaining(task.due_date)
              const isClose = days <= 2
              return (
                <div key={task.id} className={`flex items-center justify-between rounded-full border px-2.5 py-2 ${isClose ? 'border-amber-300 bg-amber-50/70' : 'border-hairline bg-canvas/60'}`}>
                  <div>
                    <p className="text-[14px] font-medium text-ink-primary">{task.title}</p>
                    <p className="mt-1 text-[12px] text-ink-secondary">{task.clients?.name || 'Unassigned'}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${isClose ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-hairline bg-white text-ink-secondary'}`}>
                    {formatDueLabel(task.due_date)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
