import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
  { label: 'Email', href: '#' },
]

export default function Landing() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('projects')
        .select('id,slug,title,tagline,route,status,cover_color')
        .eq('status', 'live')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load public projects:', error)
        setProjects([])
      } else {
        setProjects(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function unlockProject(e) {
    e.preventDefault()
    if (!selectedProject) return
    setBusy(true)
    setError('')

    const { data, error } = await supabase
      .from('projects')
      .select('id,slug,route')
      .eq('slug', selectedProject.slug)
      .eq('access_code', code)
      .single()

    if (error) {
      console.error('Project unlock error:', error)
      setError('Unable to verify access code right now.')
      setBusy(false)
      return
    }

    if (data) {
      if (selectedProject.route?.startsWith('http')) {
        window.location.assign(selectedProject.route)
      } else {
        navigate(selectedProject.route)
      }
      return
    }

    setError('Incorrect code')
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-[#0A0A0A] px-6 py-6 shadow-2xl shadow-black/40 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#A3A3A3]">PERSONAL DIGITAL SPACE</p>
              <h1 className="mt-2 font-display text-[40px] leading-none text-[#F5F5F5] sm:text-[52px]">
                Noor&apos;s Digital Space
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#A3A3A3]">
                A curated collection of private work, experiments, and client spaces — each one locked behind a simple passcode.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[13px] text-[#A3A3A3]">
              {SOCIALS.map((item) => (
                <a key={item.label} href={item.href} className="rounded-full border border-white/10 px-3 py-1.5 transition-colors hover:border-sysblue/40 hover:text-white">
                  {item.label}
                </a>
              ))}
              <Link to="/hub-admin" className="rounded-full border border-sysblue/30 bg-sysblue/10 px-3 py-1.5 text-sysblue transition-colors hover:bg-sysblue/20">
                Hub admin
              </Link>
            </div>
          </div>
        </header>

        <main className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-[24px] border border-white/10 bg-[#121212] px-4 py-10 text-center text-[14px] text-[#A3A3A3]">
              Loading spaces…
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full rounded-[24px] border border-dashed border-white/10 bg-[#121212] px-4 py-10 text-center text-[14px] text-[#A3A3A3]">
              No projects are available yet.
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setSelectedProject(project)
                  setCode('')
                  setError('')
                }}
                className="group rounded-[24px] border border-white/10 bg-[#121212] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-sysblue/40"
                style={{ boxShadow: `0 0 0 1px ${project.cover_color || '#0A84FF'}22, 0 18px 40px rgba(0, 0, 0, 0.35)` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#A3A3A3]">Locked project</p>
                    <h2 className="mt-2 text-[20px] font-semibold text-[#F5F5F5]">{project.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/40 p-2 text-[16px]">🔒</span>
                </div>
                <p className="mt-3 text-[14px] leading-6 text-[#A3A3A3]">{project.tagline || project.description}</p>
                <div className="mt-4 flex items-center justify-between text-[12px] text-[#A3A3A3]">
                  <span className="rounded-full border border-white/10 px-2.5 py-1">{project.status || 'live'}</span>
                  <span className="text-sysblue">Unlock</span>
                </div>
              </button>
            ))
          )}
        </main>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#121212] p-5 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#A3A3A3]">Access required</p>
                <h3 className="mt-1 text-[22px] font-semibold text-[#F5F5F5]">{selectedProject.title}</h3>
              </div>
              <button type="button" onClick={() => setSelectedProject(null)} className="rounded-full border border-white/10 px-2.5 py-1 text-[13px] text-[#A3A3A3]">
                Close
              </button>
            </div>

            <p className="mt-3 text-[14px] leading-6 text-[#A3A3A3]">{selectedProject.tagline || selectedProject.description}</p>

            <form onSubmit={unlockProject} className="mt-4 space-y-3">
              <label className="label-caps block">Access code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-[14px] text-[#F5F5F5] outline-none focus:border-sysblue"
              />
              {error && <p className="text-[13px] text-traffic-red">{error}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-lg bg-sysblue px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-sysbluedeep disabled:opacity-70">
                {busy ? 'Checking…' : 'Unlock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
