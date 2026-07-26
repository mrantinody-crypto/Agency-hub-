import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import BrandWorkspace from '../components/BrandWorkspace'
import StatusDot from '../components/StatusDot'
import TeamAccess from '../components/TeamAccess'
import AccountPanel from '../components/AccountPanel'

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [clients, setClients] = useState([])
  const [view, setView] = useState('today') // 'today' | 'team' | 'account' | client.id
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', industry: '', website: '', instagram: '' })

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
  }
  useEffect(() => { load() }, [])

  async function addClient(e) {
    e.preventDefault()
    if (!form.name) return
    const { data } = await supabase.from('clients').insert(form).select().single()
    setForm({ name: '', industry: '', website: '', instagram: '' })
    setShowForm(false)
    await load()
    if (data) setView(data.id)
  }

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
          <p className="font-display text-[20px] leading-tight text-ink-primary">Anti Agency Hub</p>
          <p className="text-[13px] font-medium text-ink-primary mt-1">{profile?.full_name || 'Admin'}</p>
          <p className="label-caps mt-0.5">Owner</p>
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

        <div className="p-3 border-t border-hairline space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-hairline bg-white/80 dark:bg-[#232327] px-3 py-2 text-[13px] text-ink-secondary transition-shadow hover:shadow-md"
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

        {view === 'today' && <TodayPanel clients={clients} />}
        {view === 'team' && <TeamAccess clients={clients} />}
        {view === 'account' && <AccountPanel />}
        {selected && <BrandWorkspace client={selected} canEdit />}
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
        active ? 'bg-white dark:bg-[#232327] shadow-sm text-ink-primary font-medium' : 'text-ink-secondary hover:bg-white/70 dark:hover:bg-[#232327] hover:shadow-sm'
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
        className="w-full bg-canvas dark:bg-[#232327] border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
      />
    </div>
  )
}

function TodayPanel({ clients }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tasks')
        .select('*, clients(name), profiles:assigned_to(full_name)')
        .order('due_date', { ascending: true, nullsFirst: false })
      setTasks(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < todayStr)
  const dueToday = tasks.filter((t) => t.status !== 'done' && t.due_date === todayStr)
  const pending = tasks.filter((t) => t.status !== 'done' && (!t.due_date || t.due_date > todayStr))
  const doneRecent = tasks.filter((t) => t.status === 'done').slice(0, 8)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-[28px] text-ink-primary">Today</h1>
        <p className="text-ink-secondary text-[13px] mt-1">
          {clients.length} brand{clients.length === 1 ? '' : 's'} · {tasks.filter((t) => t.status !== 'done').length} open items
        </p>
      </div>

      {loading ? (
        <p className="text-ink-secondary text-[13px]">Loading…</p>
      ) : (
        <>
          <TaskGroup title="Overdue" items={overdue} tone="red" />
          <TaskGroup title="Due today" items={dueToday} tone="yellow" />
          <TaskGroup title="Upcoming / no date" items={pending} tone="default" />
          <TaskGroup title="Recently completed" items={doneRecent} tone="green" />
        </>
      )}
    </div>
  )
}

function TaskGroup({ title, items, tone }) {
  const dot = { red: 'bg-traffic-red', yellow: 'bg-traffic-yellow', green: 'bg-traffic-green', default: 'bg-ink-tertiary' }[tone]
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
            <div key={t.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-ink-primary text-[14px]">{t.title}</p>
                <p className="text-ink-tertiary text-[12px]">
                  {t.clients?.name} {t.due_date ? `· due ${t.due_date}` : ''} {t.profiles?.full_name ? `· ${t.profiles.full_name}` : '· unassigned'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
