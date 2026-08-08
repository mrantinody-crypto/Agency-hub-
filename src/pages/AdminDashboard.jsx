import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import BrandWorkspace from '../components/BrandWorkspace'
import StatusDot from '../components/StatusDot'
import TeamAccess from '../components/TeamAccess'
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

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [view, setView] = useState('today')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', industry: '', website: '', instagram: '' })

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
  }

  async function loadTasks() {
    setTasksLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, clients(name), profiles:assigned_to(full_name)')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
    setTasksLoading(false)
  }

  useEffect(() => {
    loadClients()
    loadTasks()
  }, [])

  async function addClient(e) {
    e.preventDefault()
    if (!form.name) return
    const { data } = await supabase.from('clients').insert(form).select().single()
    setForm({ name: '', industry: '', website: '', instagram: '' })
    setShowForm(false)
    await loadClients()
    if (data) setView(data.id)
  }

  const selected = clients.find((c) => c.id === view)

  function handleClientUpdated() {
    loadClients()
    loadTasks()
  }

  function handleClientDeleted() {
    setView('today')
    loadClients()
    loadTasks()
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="w-72 bg-sidebar border-r border-hairline flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-hairline">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[20px] leading-tight text-ink-primary">Noor Agency Hub</p>
              <p className="text-[13px] font-medium text-ink-primary mt-1">{profile?.full_name || 'Admin'}</p>
              <p className="label-caps mt-0.5">Owner</p>
            </div>
            <NotificationBell tasks={tasks} />
          </div>
        </div>

        <nav className="px-3 py-3 space-y-0.5">
          <SidebarItem active={view === 'today'} onClick={() => setView('today')} label="Today" icon="☀️" />
          <SidebarItem active={view === 'team'} onClick={() => setView('team')} label="Team & Access" icon="🔑" />
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
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full text-[13px] text-sysblue border border-sysblue/30 bg-sysblue/5 rounded-lg py-2 hover:bg-sysblue/10 transition-colors"
          >
            + new brand
          </button>
          <button onClick={signOut} className="w-full text-[13px] text-ink-secondary hover:text-ink-primary py-1">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {showForm && (
          <form onSubmit={addClient} className="mb-6 mac-window p-5 grid grid-cols-2 gap-4 max-w-2xl">
            <Field label="Brand name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} />
            <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
            <Field label="Instagram" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
            <div className="col-span-2">
              <button className="bg-sysblue text-white text-[13px] font-medium rounded-md px-4 py-2 hover:bg-sysbluedeep">Add brand</button>
            </div>
          </form>
        )}

        {view === 'today' && <TodayPanel clients={clients} tasks={tasks} loading={tasksLoading} onRefreshTasks={loadTasks} profileName={profile?.full_name || 'there'} />}
        {view === 'team' && <TeamAccess clients={clients} />}
        {view === 'account' && <AccountPanel />}
        {selected && <BrandWorkspace client={selected} canEdit onClientUpdated={handleClientUpdated} onClientDeleted={handleClientDeleted} />}
        {!selected && view !== 'today' && view !== 'team' && view !== 'account' && (
          <p className="text-ink-secondary text-[14px]">Select a brand from the sidebar, or add your first one.</p>
        )}
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

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label-caps block mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-canvas dark:bg-[#121212] border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
      />
    </div>
  )
}

function TodayPanel({ clients, tasks, loading, onRefreshTasks, profileName }) {
  const [completingIds, setCompletingIds] = useState([])
  const todayStr = new Date().toISOString().slice(0, 10)

  async function completeTask(task) {
    setCompletingIds((prev) => [...prev, task.id])
    await supabase.from('tasks').update({ status: 'done' }).eq('id', task.id)
    window.setTimeout(() => {
      setCompletingIds((prev) => prev.filter((id) => id !== task.id))
      onRefreshTasks()
    }, 220)
  }

  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayStr)
  const dueToday = tasks.filter((t) => t.status !== 'done' && t.due_date === todayStr)
  const upcoming = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date > todayStr).sort((a, b) => a.due_date.localeCompare(b.due_date))

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
            <p className="text-[13px] text-ink-secondary mt-1">Urgent tasks that need attention now.</p>
          </div>
          <div className="rounded-full bg-sysblue/10 px-2.5 py-1 text-[12px] font-medium text-sysblue">{overdue.length + dueToday.length} active</div>
        </div>

        {loading ? (
          <p className="text-[13px] text-ink-secondary">Loading tasks…</p>
        ) : urgentEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-3 py-4 text-center text-[13px] text-ink-secondary">
            Nothing urgent today. The runway is clear.
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
                            {task.due_date === todayStr ? 'Due today' : 'Overdue'} · {task.profiles?.full_name || 'Unassigned'}
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
            <p className="text-[13px] text-ink-secondary mt-1">The next near-future work coming up.</p>
          </div>
          <div className="rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-medium text-amber-700">{Math.min(upcoming.length, 7)} upcoming</div>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-3 py-4 text-center text-[13px] text-ink-secondary">
            No upcoming deadlines in the near future.
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
                    <p className="mt-1 text-[12px] text-ink-secondary">{task.clients?.name || 'Unassigned'} · {task.profiles?.full_name || 'Unassigned'}</p>
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

      <div className="rounded-[20px] border border-hairline bg-white/80 p-3.5 shadow-sm">
        <p className="label-caps mb-2">Agency pulse</p>
        <p className="text-[14px] text-ink-secondary">
          {clients.length} brand{clients.length === 1 ? '' : 's'} · {tasks.filter((t) => t.status !== 'done').length} open items · {tasks.filter((t) => t.status === 'done').length} completed
        </p>
      </div>
    </div>
  )
}
