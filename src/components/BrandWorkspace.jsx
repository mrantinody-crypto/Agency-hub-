import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import StatusDot from './StatusDot'

const TABS = ['Info', 'Calendar', 'Scripts', 'Docs & Sheets', 'Tasks']

export default function BrandWorkspace({ client, canEdit, onClientUpdated, onClientDeleted }) {
  const [tab, setTab] = useState('Info')

  async function handleDelete() {
    if (!canEdit) return
    const confirmed = window.confirm(`Delete ${client.name}? This will remove the brand and its related data.`)
    if (!confirmed) return
    await supabase.from('clients').delete().eq('id', client.id)
    onClientDeleted?.()
  }

  return (
    <div className="mac-window overflow-hidden">
      <div className="px-4 py-3 border-b border-hairline flex items-center gap-3 bg-sidebar">
        <span className="font-display text-[20px] text-ink-primary">{client.name}</span>
        <span className="ml-auto flex items-center gap-2">
          <StatusDot status={client.status} />
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full border border-hairline bg-white/80 px-2.5 py-1 text-[12px] text-ink-secondary transition-colors hover:border-red-300 hover:text-red-600 dark:bg-[#121212]"
              aria-label={`Delete ${client.name}`}
            >
              🗑
            </button>
          )}
        </span>
      </div>

      <div className="px-4 pt-3">
        <div className="inline-flex bg-canvas dark:bg-[#121212] border border-hairline rounded-full p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[13px] px-3 py-1.5 rounded-full transition-all ${
                tab === t ? 'bg-white dark:bg-[#121212] shadow-sm text-ink-primary font-medium' : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {tab === 'Info' && <Info client={client} canEdit={canEdit} onClientUpdated={onClientUpdated} />}
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
    <div className="rounded-xl border border-dashed border-hairline/90 px-3 py-4 text-center">
      <p className="text-[13px] text-ink-secondary">{text}</p>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 px-3 py-2.5">
      <span className="label-caps w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-ink-primary text-[14px] break-all">{value}</span>
    </div>
  )
}

function SectionHeader({ title, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="label-caps px-1">{title}</p>
      {action}
    </div>
  )
}

function Info({ client, canEdit, onClientUpdated }) {
  const [editingSection, setEditingSection] = useState(null)
  const [form, setForm] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    other_links: '',
    login_notes: '',
  })

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

  useEffect(() => {
    setForm({
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      website: client.website || '',
      instagram: client.instagram || '',
      facebook: client.facebook || '',
      linkedin: client.linkedin || '',
      other_links: client.other_links || '',
      login_notes: client.login_notes || '',
    })
    setEditingSection(null)
  }, [client.id])

  function openEditor(section) {
    setEditingSection(section)
  }

  function resetEditor() {
    setEditingSection(null)
    setForm({
      contact_name: client.contact_name || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      website: client.website || '',
      instagram: client.instagram || '',
      facebook: client.facebook || '',
      linkedin: client.linkedin || '',
      other_links: client.other_links || '',
      login_notes: client.login_notes || '',
    })
  }

  async function handleSave() {
    const payload = {
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      website: form.website || null,
      instagram: form.instagram || null,
      facebook: form.facebook || null,
      linkedin: form.linkedin || null,
      other_links: form.other_links || null,
      login_notes: form.login_notes || null,
    }
    await supabase.from('clients').update(payload).eq('id', client.id)
    setEditingSection(null)
    onClientUpdated?.()
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212]">
        <SectionHeader
          title="Personal / contact information"
          action={canEdit ? <button type="button" onClick={() => openEditor('contact')} className="text-[12px] font-medium text-sysblue">{editingSection === 'contact' ? 'Editing…' : 'Edit'}</button> : null}
        />
        {editingSection === 'contact' ? (
          <div className="space-y-3">
            <Field label="Contact name" value={form.contact_name} onChange={(v) => setForm((prev) => ({ ...prev, contact_name: v }))} />
            <Field label="Contact email" value={form.contact_email} onChange={(v) => setForm((prev) => ({ ...prev, contact_email: v }))} />
            <Field label="Contact phone" value={form.contact_phone} onChange={(v) => setForm((prev) => ({ ...prev, contact_phone: v }))} />
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={handleSave} className="rounded-full bg-sysblue px-3 py-1.5 text-[13px] font-medium text-white">Save</button>
              <button type="button" onClick={resetEditor} className="rounded-full border border-hairline px-3 py-1.5 text-[13px] text-ink-secondary">Cancel</button>
            </div>
          </div>
        ) : hasContact ? (
          <div className="divide-y divide-hairline">
            {contact.map(([l, v]) => <Row key={l} label={l} value={v} />)}
          </div>
        ) : (
          <EmptyState text="No contact info added yet." />
        )}
      </div>

      <div className="rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212]">
        <SectionHeader
          title="Account & socials"
          action={canEdit ? <button type="button" onClick={() => openEditor('account')} className="text-[12px] font-medium text-sysblue">{editingSection === 'account' ? 'Editing…' : 'Edit'}</button> : null}
        />
        {editingSection === 'account' ? (
          <div className="space-y-3">
            <Field label="Website" value={form.website} onChange={(v) => setForm((prev) => ({ ...prev, website: v }))} />
            <Field label="Instagram" value={form.instagram} onChange={(v) => setForm((prev) => ({ ...prev, instagram: v }))} />
            <Field label="Facebook" value={form.facebook} onChange={(v) => setForm((prev) => ({ ...prev, facebook: v }))} />
            <Field label="LinkedIn" value={form.linkedin} onChange={(v) => setForm((prev) => ({ ...prev, linkedin: v }))} />
            <Field label="Other links" value={form.other_links} onChange={(v) => setForm((prev) => ({ ...prev, other_links: v }))} />
            <div>
              <label className="label-caps mb-1.5 block">Login notes</label>
              <textarea
                value={form.login_notes}
                onChange={(e) => setForm((prev) => ({ ...prev, login_notes: e.target.value }))}
                className="min-h-[88px] w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink-primary outline-none focus-ring dark:bg-[#121212]"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={handleSave} className="rounded-full bg-sysblue px-3 py-1.5 text-[13px] font-medium text-white">Save</button>
              <button type="button" onClick={resetEditor} className="rounded-full border border-hairline px-3 py-1.5 text-[13px] text-ink-secondary">Cancel</button>
            </div>
          </div>
        ) : hasAccount ? (
          <div className="divide-y divide-hairline">
            {account.map(([l, v]) => <Row key={l} label={l} value={v} />)}
          </div>
        ) : (
          <EmptyState text="No account details added yet." />
        )}
      </div>

      {client.login_notes && !editingSection && (
        <div className="rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212]">
          <p className="label-caps mb-2 px-1">Notes</p>
          <div className="rounded-lg border border-hairline/80 bg-canvas/60 p-3 text-[14px] text-ink-primary whitespace-pre-wrap dark:bg-[#121212]">
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
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink-primary outline-none focus-ring dark:bg-[#121212]"
      />
    </div>
  )
}

function AddButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="rounded-full border border-sysblue/30 bg-sysblue/10 px-3 py-1.5 text-[13px] font-medium text-sysblue transition-colors hover:bg-sysblue/15">
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
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="label-caps">Calendar</p>
            <AddButton label="+ add" onClick={() => setShowForm(!showForm)} />
          </div>
          {showForm && (
            <form onSubmit={addEvent} className="mt-2 rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212] flex flex-wrap gap-3 items-end">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Platform" value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} placeholder="Instagram" />
              <Field label="Date" type="date" value={form.scheduled_date} onChange={(v) => setForm({ ...form, scheduled_date: v })} />
              <button className="rounded-full bg-sysblue px-3 py-2 text-[13px] font-medium text-white">Save</button>
            </form>
          )}
        </div>
      )}
      {events.length === 0 ? <EmptyState text="Nothing on the calendar yet." /> : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between rounded-full border border-hairline bg-white/80 px-3 py-2.5 transition-colors hover:border-sysblue/30 dark:bg-[#121212]">
              <div className="min-w-0">
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
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="label-caps">Scripts</p>
            <AddButton label="+ add" onClick={() => setShowForm(!showForm)} />
          </div>
          {showForm && (
            <form onSubmit={addItem} className="mt-2 rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212] space-y-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} full />
              <div>
                <label className="label-caps block mb-1.5">Content</label>
                <textarea
                  className="min-h-[96px] w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink-primary outline-none focus-ring dark:bg-[#121212]"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </div>
              <button className="rounded-full bg-sysblue px-3 py-2 text-[13px] font-medium text-white">Save</button>
            </form>
          )}
        </div>
      )}
      {items.length === 0 ? <EmptyState text="No scripts or copy saved yet." /> : (
        <div className="space-y-2">
          {items.map((it) => (
            <details key={it.id} className="rounded-2xl border border-hairline bg-white/80 px-3 py-2.5 transition-colors hover:border-sysblue/30 dark:bg-[#121212]">
              <summary className="flex cursor-pointer items-center justify-between list-none">
                <span className="text-ink-primary text-[14px] font-medium">{it.title}</span>
                <span className="label-caps">{it.content_type}</span>
              </summary>
              <p className="mt-2 text-ink-secondary text-[13px] whitespace-pre-wrap">{it.body}</p>
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
      <p className="mb-2 text-ink-tertiary text-[12px]">
        Paste links to Google Docs, Sheets, or anything else you want on hand for this brand.
      </p>
      {canEdit && (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="label-caps">Resources</p>
            <AddButton label="+ add" onClick={() => setShowForm(!showForm)} />
          </div>
          {showForm && (
            <form onSubmit={addItem} className="mt-2 rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212] flex flex-wrap gap-3 items-end">
              <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="Content calendar sheet" />
              <Field label="URL" value={form.url} onChange={(v) => setForm({ ...form, url: v })} placeholder="https://docs.google.com/…" />
              <div>
                <label className="label-caps block mb-1.5">Type</label>
                <select
                  value={form.resource_type}
                  onChange={(e) => setForm({ ...form, resource_type: e.target.value })}
                  className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink-primary outline-none focus-ring dark:bg-[#121212]"
                >
                  <option value="google_doc">Google Doc</option>
                  <option value="google_sheet">Google Sheet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button className="rounded-full bg-sysblue px-3 py-2 text-[13px] font-medium text-white">Save</button>
            </form>
          )}
        </div>
      )}
      {items.length === 0 ? <EmptyState text="No linked docs or sheets yet." /> : (
        <div className="space-y-2">
          {items.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 rounded-full border border-hairline bg-white/80 px-3 py-2.5 transition-colors hover:border-sysblue/30 hover:shadow-sm dark:bg-[#121212]">
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
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="label-caps">Tasks</p>
          <AddButton label="+ add" onClick={() => setShowForm(!showForm)} />
        </div>
        {showForm && (
          <form onSubmit={addTask} className="mt-2 rounded-2xl border border-hairline bg-white/80 p-3 dark:bg-[#121212] flex flex-wrap gap-3 items-end">
            <Field label="Task" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="Due" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
            <div>
              <label className="label-caps block mb-1.5">Assign to</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] text-ink-primary outline-none focus-ring dark:bg-[#121212]"
              >
                <option value="">Unassigned</option>
                {team.map((p) => <option key={p.id} value={p.id}>{p.full_name || 'Unnamed'}</option>)}
              </select>
            </div>
            <button className="rounded-full bg-sysblue px-3 py-2 text-[13px] font-medium text-white">Save</button>
          </form>
        )}
      </div>
      {tasks.length === 0 ? <EmptyState text="No tasks yet — add the first one." /> : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-full border border-hairline bg-white/80 px-3 py-2.5 transition-colors hover:border-sysblue/30 dark:bg-[#121212]">
              <div className="min-w-0">
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
