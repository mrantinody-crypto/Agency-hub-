import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import StatusDot from './StatusDot'

const TABS = ['Info', 'Calendar', 'Scripts', 'Docs & Sheets', 'Tasks']

export default function BrandWorkspace({ client, canEdit }) {
  const [tab, setTab] = useState('Info')

  return (
    <div className="mac-window overflow-hidden">
      <div className="px-5 py-3.5 border-b border-hairline flex items-center gap-3 bg-sidebar">
        <div className="traffic-lights">
          <span className="traffic-dot bg-traffic-red" />
          <span className="traffic-dot bg-traffic-yellow" />
          <span className="traffic-dot bg-traffic-green" />
        </div>
        <span className="text-[13px] font-medium text-ink-primary">{client.name}</span>
        <span className="ml-auto"><StatusDot status={client.status} /></span>
      </div>

      <div className="px-5 pt-4">
        <div className="inline-flex bg-canvas border border-hairline rounded-lg p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[13px] px-3.5 py-1.5 rounded-md transition-colors ${
                tab === t ? 'bg-white shadow-sm text-ink-primary font-medium' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {tab === 'Info' && <Info client={client} canEdit={canEdit} />}
        {tab === 'Calendar' && <Calendar clientId={client.id} canEdit={canEdit} />}
        {tab === 'Scripts' && <Scripts clientId={client.id} canEdit={canEdit} />}
        {tab === 'Docs & Sheets' && <Resources clientId={client.id} canEdit={canEdit} />}
        {tab === 'Tasks' && <Tasks clientId={client.id} canEdit={canEdit} />}
      </div>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="border border-dashed border-hairline rounded-card py-10 text-center">
      <p className="text-ink-secondary text-[13px]">{text}</p>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex px-4 py-3 gap-4">
      <span className="label-caps w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-ink-primary text-[14px] break-all">{value}</span>
    </div>
  )
}

function Info({ client }) {
  const account = [
    ['Website', client.website],
    ['Instagram', client.instagram],
    ['Facebook', client.facebook],
    ['LinkedIn', client.linkedin],
    ['Other links', client.other_links],
  ]
  const contact = [
    ['Contact name', client.contact_name],
    ['Contact email', client.contact_email],
    ['Contact phone', client.contact_phone],
  ]
  const hasAccount = account.some(([, v]) => v)
  const hasContact = contact.some(([, v]) => v)

  return (
    <div className="space-y-5">
      <div>
        <p className="label-caps mb-2 px-1">Personal / contact information</p>
        {hasContact ? (
          <div className="border border-hairline rounded-card divide-y divide-hairline bg-white">
            {contact.map(([l, v]) => <Row key={l} label={l} value={v} />)}
          </div>
        ) : <EmptyState text="No contact info added yet." />}
      </div>
      <div>
        <p className="label-caps mb-2 px-1">Account & socials</p>
        {hasAccount ? (
          <div className="border border-hairline rounded-card divide-y divide-hairline bg-white">
            {account.map(([l, v]) => <Row key={l} label={l} value={v} />)}
          </div>
        ) : <EmptyState text="No account details added yet." />}
      </div>
      {client.login_notes && (
        <div>
          <p className="label-caps mb-2 px-1">Notes</p>
          <div className="border border-hairline rounded-card bg-white p-4 text-[14px] text-ink-primary whitespace-pre-wrap">
            {client.login_notes}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, full }) {
  return (
    <div className={full ? 'w-full' : ''}>
      <label className="label-caps block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none w-full"
      />
    </div>
  )
}

function AddButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="text-[13px] text-sysblue border border-sysblue/30 bg-sysblue/5 rounded-md px-3 py-1.5 hover:bg-sysblue/10 transition-colors">
      {label}
    </button>
  )
}

function Calendar({ clientId, canEdit }) {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ title: '', platform: '', scheduled_date: '' })
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const { data } = await supabase.from('calendar_events').select('*').eq('client_id', clientId).order('scheduled_date')
    setEvents(data || [])
  }
  useEffect(() => { load() }, [clientId])

  async function addEvent(e) {
    e.preventDefault()
    if (!form.title || !form.scheduled_date) return
    await supabase.from('calendar_events').insert({ ...form, client_id: clientId })
    setForm({ title: '', platform: '', scheduled_date: '' })
    setShowForm(false)
    load()
  }

  async function cycleStatus(ev) {
    if (!canEdit) return
    const next = { planned: 'in_progress', in_progress: 'posted', posted: 'planned' }[ev.status]
    await supabase.from('calendar_events').update({ status: next }).eq('id', ev.id)
    load()
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <AddButton label="+ add to calendar" onClick={() => setShowForm(!showForm)} />
          {showForm && (
            <form onSubmit={addEvent} className="mt-3 border border-hairline rounded-card bg-white p-4 flex flex-wrap gap-3 items-end">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Platform" value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} placeholder="Instagram" />
              <Field label="Date" type="date" value={form.scheduled_date} onChange={(v) => setForm({ ...form, scheduled_date: v })} />
              <button className="bg-sysblue text-white text-[13px] font-medium rounded-md px-4 py-2 hover:bg-sysbluedeep">Save</button>
            </form>
          )}
        </div>
      )}
      {events.length === 0 ? <EmptyState text="Nothing on the calendar yet." /> : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between border border-hairline rounded-card bg-white px-4 py-3">
              <div>
                <p className="text-ink-primary text-[14px] font-medium">{ev.title}</p>
                <p className="text-ink-tertiary text-[12px]">{ev.scheduled_date} · {ev.platform || '—'}</p>
              </div>
              <StatusDot status={ev.status} onClick={canEdit ? () => cycleStatus(ev) : undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Scripts({ clientId, canEdit }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', body: '', content_type: 'script' })
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const { data } = await supabase.from('content_items').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [clientId])

  async function addItem(e) {
    e.preventDefault()
    if (!form.title) return
    await supabase.from('content_items').insert({ ...form, client_id: clientId })
    setForm({ title: '', body: '', content_type: 'script' })
    setShowForm(false)
    load()
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-4">
          <AddButton label="+ add script / copy" onClick={() => setShowForm(!showForm)} />
          {showForm && (
            <form onSubmit={addItem} className="mt-3 border border-hairline rounded-card bg-white p-4 space-y-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} full />
              <div>
                <label className="label-caps block mb-1.5">Content</label>
                <textarea
                  className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none min-h-[100px]"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>
              <button className="bg-sysblue text-white text-[13px] font-medium rounded-md px-4 py-2 hover:bg-sysbluedeep">Save</button>
            </form>
          )}
        </div>
      )}
      {items.length === 0 ? <EmptyState text="No scripts or copy saved yet." /> : (
        <div className="space-y-2">
          {items.map((it) => (
            <details key={it.id} className="border border-hairline rounded-card bg-white px-4 py-3">
              <summary className="cursor-pointer flex items-center justify-between list-none">
                <span className="text-ink-primary text-[14px] font-medium">{it.title}</span>
                <span className="label-caps">{it.content_type}</span>
              </summary>
              <p className="text-ink-secondary text-[13px] mt-3 whitespace-pre-wrap">{it.body}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

function Resources({ clientId, canEdit }) {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ label: '', url: '', resource_type: 'google_doc' })
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const { data } = await supabase.from('resources').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [clientId])

  async function addItem(e) {
    e.preventDefault()
    if (!form.label || !form.url) return
    await supabase.from('resources').insert({ ...form, client_id: clientId })
    setForm({ label: '', url: '', resource_type: 'google_doc' })
    setShowForm(false)
    load()
  }

  const ICON = { google_doc: '📄', google_sheet: '📊', other: '🔗' }

  return (
    <div>
      <p className="text-ink-tertiary text-[12px] mb-3">
        Paste links to Google Docs, Sheets, or anything else you want on hand for this brand.
      </p>
      {canEdit && (
        <div className="mb-4">
          <AddButton label="+ add link" onClick={() => setShowForm(!showForm)} />
          {showForm && (
            <form onSubmit={addItem} className="mt-3 border border-hairline rounded-card bg-white p-4 flex flex-wrap gap-3 items-end">
              <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="Content calendar sheet" />
              <Field label="URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://docs.google.com/…" />
              <div>
                <label className="label-caps block mb-1.5">Type</label>
                <select
                  value={form.resource_type}
                  onChange={(e) => setForm({ ...form, resource_type: e.target.value })}
                  className="bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                >
                  <option value="google_doc">Google Doc</option>
                  <option value="google_sheet">Google Sheet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button className="bg-sysblue text-white text-[13px] font-medium rounded-md px-4 py-2 hover:bg-sysbluedeep">Save</button>
            </form>
          )}
        </div>
      )}
      {items.length === 0 ? <EmptyState text="No linked docs or sheets yet." /> : (
        <div className="space-y-2">
          {items.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 border border-hairline rounded-card bg-white px-4 py-3 hover:border-sysblue/40 transition-colors">
              <span className="text-lg">{ICON[r.resource_type]}</span>
              <span className="text-ink-primary text-[14px] font-medium">{r.label}</span>
              <span className="ml-auto text-ink-tertiary text-[12px] truncate max-w-[220px]">{r.url}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function Tasks({ clientId, canEdit }) {
  const [tasks, setTasks] = useState([])
  const [team, setTeam] = useState([])
  const [form, setForm] = useState({ title: '', due_date: '', assigned_to: '' })
  const [showForm, setShowForm] = useState(false)
  const { profile } = useAuth()

  async function load() {
    const { data } = await supabase
      .from('tasks')
      .select('*, profiles:assigned_to(full_name)')
      .eq('client_id', clientId)
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data || [])
  }

  async function loadTeam() {
    const { data } = await supabase
      .from('client_members')
      .select('profiles(id, full_name, role)')
      .eq('client_id', clientId)
    setTeam((data || []).map((r) => r.profiles).filter((p) => p && p.role !== 'client'))
  }

  useEffect(() => { load(); loadTeam() }, [clientId])

  async function addTask(e) {
    e.preventDefault()
    if (!form.title) return
    await supabase.from('tasks').insert({ ...form, assigned_to: form.assigned_to || null, client_id: clientId })
    setForm({ title: '', due_date: '', assigned_to: '' })
    setShowForm(false)
    load()
  }

  async function cycleStatus(t) {
    const next = { pending: 'in_progress', in_progress: 'done', done: 'pending' }[t.status]
    await supabase.from('tasks').update({ status: next }).eq('id', t.id)
    load()
  }

  return (
    <div>
      <div className="mb-4">
        <AddButton label="+ add task" onClick={() => setShowForm(!showForm)} />
        {showForm && (
          <form onSubmit={addTask} className="mt-3 border border-hairline rounded-card bg-white p-4 flex flex-wrap gap-3 items-end">
            <Field label="Task" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="Due" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
            <div>
              <label className="label-caps block mb-1.5">Assign to</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
              >
                <option value="">Unassigned</option>
                {team.map((p) => <option key={p.id} value={p.id}>{p.full_name || 'Unnamed'}</option>)}
              </select>
            </div>
            <button className="bg-sysblue text-white text-[13px] font-medium rounded-md px-4 py-2 hover:bg-sysbluedeep">Save</button>
          </form>
        )}
      </div>
      {tasks.length === 0 ? <EmptyState text="No tasks yet — add the first one." /> : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between border border-hairline rounded-card bg-white px-4 py-3">
              <div>
                <p className="text-ink-primary text-[14px] font-medium">{t.title}</p>
                <p className="text-ink-tertiary text-[12px]">
                  {t.due_date ? `due ${t.due_date}` : 'no due date'}
                  {t.profiles?.full_name ? ` · ${t.profiles.full_name}` : ''}
                </p>
              </div>
              <StatusDot status={t.status} onClick={() => cycleStatus(t)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
