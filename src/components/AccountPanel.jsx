import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function AccountPanel() {
  const { profile, refreshProfile, user } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [savingName, setSavingName] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setFullName(profile?.full_name || '')
  }, [profile])

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

  const roleLabel = profile?.role === 'admin' ? 'Admin' : profile?.role === 'team' ? 'Designer' : 'Client'

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
