import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

const EMPTY_FORM = {
  title: '',
  slug: '',
  tagline: '',
  description: '',
  route: '',
  access_code: '',
  cover_color: '#0A84FF',
  status: 'draft',
}

const DEFAULT_PROJECT = {
  title: 'My Comfort Spot',
  slug: 'comfort-spot',
  tagline: 'A little corner just for him',
  description: 'A little corner just for him',
  route: '/comfort-spot',
  access_code: 'NOOR678',
  cover_color: '#7C3AED',
  status: 'live',
}

export default function HubAdmin() {
  const { session, profile, loading, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
  }

  async function ensureDefaultProject() {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', DEFAULT_PROJECT.slug)
        .single()

      if (!data) {
        await supabase.from('projects').insert(DEFAULT_PROJECT)
      }
    } catch (err) {
      console.warn('Unable to ensure default comfort-spot project:', err)
    }
  }

  useEffect(() => {
    if (session && isAdmin) {
      ;(async () => {
        await ensureDefaultProject()
        loadProjects()
      })()
    }
  }, [session, isAdmin])

  if (loading) return <div className="min-h-screen bg-canvas p-8 text-[14px] text-ink-secondary">Loading…</div>
  if (!session || !isAdmin) return <Navigate to="/agency-hub/login" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)

    const payload = {
      title: form.title,
      slug: form.slug,
      tagline: form.tagline,
      description: form.description,
      route: form.route,
      access_code: form.access_code,
      cover_color: form.cover_color,
      status: form.status,
    }

    if (editingId) {
      await supabase.from('projects').update(payload).eq('id', editingId)
    } else {
      await supabase.from('projects').insert(payload)
    }

    setBusy(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
    loadProjects()
  }

  async function handleDelete(id) {
    const confirmed = window.confirm('Delete this project?')
    if (!confirmed) return
    await supabase.from('projects').delete().eq('id', id)
    loadProjects()
  }

  function startEdit(project) {
    setEditingId(project.id)
    setForm({
      title: project.title || '',
      slug: project.slug || '',
      tagline: project.tagline || '',
      description: project.description || '',
      route: project.route || '',
      access_code: project.access_code || '',
      cover_color: project.cover_color || '#0A84FF',
      status: project.status || 'draft',
    })
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-6 text-ink-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="label-caps">Hub admin</p>
            <h1 className="font-display text-[30px] text-ink-primary">Manage projects</h1>
          </div>
          <button type="button" onClick={() => navigate('/agency-hub')} className="rounded-full border border-hairline bg-white/80 px-3 py-2 text-[13px] text-ink-secondary">
            Back to Agency Hub
          </button>
        </div>

        <div className="mac-window overflow-hidden">
          <div className="border-b border-hairline bg-sidebar px-5 py-3">
            <p className="font-display text-[18px] text-ink-primary">Add / edit project</p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3 p-5 md:grid-cols-2">
            <input className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            <input className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
            <input className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" placeholder="Route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
            <input className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" placeholder="Access code" value={form.access_code} onChange={(e) => setForm({ ...form, access_code: e.target.value })} />
            <input type="color" className="h-10 w-full rounded-lg border border-hairline bg-canvas p-1" value={form.cover_color} onChange={(e) => setForm({ ...form, cover_color: e.target.value })} />
            <select className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="live">Live</option>
            </select>
            <textarea className="md:col-span-2 min-h-[90px] rounded-lg border border-hairline bg-canvas px-3 py-2 text-[14px] outline-none focus-ring" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="md:col-span-2 flex items-center gap-2">
              <button type="submit" disabled={busy} className="rounded-full bg-sysblue px-4 py-2 text-[13px] font-medium text-white">{editingId ? 'Save project' : 'Add project'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM) }} className="rounded-full border border-hairline px-4 py-2 text-[13px] text-ink-secondary">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="mac-window overflow-hidden">
          <div className="border-b border-hairline bg-sidebar px-5 py-3">
            <p className="font-display text-[18px] text-ink-primary">Projects</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-canvas/70 text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-t border-hairline">
                    <td className="px-4 py-3 text-ink-primary">{project.title}</td>
                    <td className="px-4 py-3">{project.slug}</td>
                    <td className="px-4 py-3">{project.route}</td>
                    <td className="px-4 py-3">{project.access_code}</td>
                    <td className="px-4 py-3">{project.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(project)} className="rounded-full border border-hairline px-2.5 py-1 text-[12px] text-ink-secondary">Edit</button>
                        <button type="button" onClick={() => handleDelete(project.id)} className="rounded-full border border-red-300 px-2.5 py-1 text-[12px] text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
