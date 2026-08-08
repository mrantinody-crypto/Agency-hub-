import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function AccountPanel() {
  const { profile, refreshProfile, user, isOwner } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [savingName, setSavingName] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [projectAccessConfig, setProjectAccessConfig] = useState([])
  const [projectAccessLoading, setProjectAccessLoading] = useState(false)
  const [projectAccessMessage, setProjectAccessMessage] = useState('')
  const [projectAccessError, setProjectAccessError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setFullName(profile?.full_name || '')
  }, [profile])

  useEffect(() => {
    if (!isOwner) return

    async function loadProjectAccessConfig() {
      setProjectAccessLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('id,title,slug,access_code,status')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load project access codes:', error)
        setProjectAccessError('Unable to load project access settings.')
        setProjectAccessConfig([])
      } else {
        setProjectAccessConfig(data || [])
        setProjectAccessError('')
      }

      setProjectAccessLoading(false)
    }

    loadProjectAccessConfig()
  }, [isOwner])

  function updateProjectAccessCode(projectId, value) {
    setProjectAccessConfig((prev) => prev.map((project) => (project.id === projectId ? { ...project, access_code: value } : project)))
  }

  async function saveProjectAccessCode(projectId) {
    const project = projectAccessConfig.find((item) => item.id === projectId)
    if (!project) return

    setProjectAccessMessage('')
    setProjectAccessError('')

    const { error } = await supabase.from('projects').update({ access_code: project.access_code }).eq('id', projectId)
    if (error) {
      console.error('Failed to save access code:', error)
      setProjectAccessError('Unable to save access code. Please try again.')
      return
    }

    setProjectAccessMessage(`Saved access code for ${project.title}.`)
  }

  async function saveName() {
    if (!user?.id || !fullName.trim()) return
    setSavingName(true)
    setMessage('')
    setError('')
    try {
      await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id)
      await refreshProfile(user.id)
      setMessage('Profile updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setMessage('')
    setError('')
    if (passwords.next !== passwords.confirm) {
      setError('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.next })
      if (error) throw error
      setMessage('Password updated')
      setPasswords({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const roleLabel = profile?.role === 'admin' ? 'Admin' : profile?.role === 'owner' ? 'Owner' : profile?.role === 'team' ? 'Designer' : 'Client'

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[26px] text-ink-primary">Account</h1>
        <p className="text-ink-secondary text-[13px] mt-1">Manage your profile and keep your access details current.</p>
      </div>

      <div className="mac-window p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div>
              <label className="label-caps block mb-2">Full name</label>
              <input
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={saveName}
              />
            </div>
            <div>
              <label className="label-caps block mb-2">Email</label>
              <div className="rounded-lg border border-hairline bg-canvas/70 px-3 py-2 text-[14px] text-ink-secondary">{user?.email || '—'}</div>
            </div>
            <div>
              <label className="label-caps block mb-2">Role</label>
              <div className="inline-flex rounded-full border border-sysblue/30 bg-sysblue/10 px-3 py-1.5 text-[13px] font-medium text-sysblue">{roleLabel}</div>
            </div>
            {message && <p className="text-[13px] text-sysblue">{message}</p>}
            {error && <p className="text-[13px] text-traffic-red">{error}</p>}
          </div>
          {isOwner && (
            <div className="rounded-2xl border border-hairline bg-canvas/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-[18px] text-ink-primary">Project access codes</h2>
                  <p className="text-[12px] text-ink-secondary mt-1">Owner-only access code management for locked projects.</p>
                </div>
              </div>
              {projectAccessLoading ? (
                <p className="text-[13px] text-ink-secondary mt-4">Loading project settings…</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {projectAccessConfig.map((project) => (
                    <div key={project.id} className="grid gap-2 md:grid-cols-[1.2fr_1fr_auto] items-end">
                      <div>
                        <p className="font-medium text-ink-primary">{project.title}</p>
                        <p className="text-[12px] text-ink-secondary">{project.slug} · {project.status}</p>
                      </div>
                      <input
                        value={project.access_code || ''}
                        onChange={(e) => updateProjectAccessCode(project.id, e.target.value)}
                        placeholder="Access code"
                        className="w-full rounded-lg border border-hairline bg-white/90 px-3 py-2 text-[14px] text-ink-primary outline-none focus-ring"
                      />
                      <button
                        type="button"
                        onClick={() => saveProjectAccessCode(project.id)}
                        className="rounded-full bg-sysblue px-3 py-2 text-[12px] font-semibold text-white"
                      >
                        Save
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {projectAccessMessage && <p className="text-[13px] text-sysblue mt-3">{projectAccessMessage}</p>}
              {projectAccessError && <p className="text-[13px] text-traffic-red mt-3">{projectAccessError}</p>}
            </div>
          )}

          <div className="rounded-2xl border border-hairline bg-canvas/70 p-4">
            <h2 className="font-display text-[18px] text-ink-primary">Change password</h2>
            <p className="text-[12px] text-ink-secondary mt-1">Use a strong password for your account.</p>
            <form onSubmit={savePassword} className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="New password"
                className="w-full bg-white dark:bg-[#121212] border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Confirm password"
                className="w-full bg-white dark:bg-[#121212] border border-hairline rounded-lg px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
              />
              <button type="submit" disabled={savingPassword} className="w-full bg-sysblue text-white text-[13px] font-medium rounded-lg px-4 py-2 hover:bg-sysbluedeep transition-colors disabled:opacity-60">
                {savingPassword ? 'Saving…' : 'Save password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
