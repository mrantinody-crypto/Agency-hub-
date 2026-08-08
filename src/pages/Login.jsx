import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, supabaseAvailable } from '../lib/supabaseClient'
import { useTheme } from '../contexts/ThemeContext'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
      }
      navigate('/agency-hub')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        { !supabaseAvailable && (
          <div className="mb-4 rounded-3xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">Connection issue</p>
            <p className="mt-1">Supabase is not configured in the deployed app. Please check Vercel environment variables and redeploy.</p>
          </div>
        ) }
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={toggleTheme} className="rounded-full border border-hairline bg-white/80 px-3 py-1.5 text-[12px] text-ink-secondary shadow-sm">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
        <div className="mac-window shadow-pop overflow-hidden">
            <div className="px-5 py-3.5 border-b border-hairline flex items-center gap-2 bg-sidebar rounded-t-window">
            <div className="traffic-lights">
              <span className="traffic-dot bg-traffic-red" />
              <span className="traffic-dot bg-traffic-yellow" />
              <span className="traffic-dot bg-traffic-green" />
            </div>
            <span className="text-[13px] text-ink-secondary mx-auto pr-10">Noor Agency Hub — Sign in</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label-caps block mb-1.5">Full name</label>
                <input
                  className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label-caps block mb-1.5">Email</label>
              <input
                type="email"
                className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-caps block mb-1.5">Password</label>
              <input
                type="password"
                className="w-full bg-canvas border border-hairline rounded-md px-3 py-2 text-[14px] text-ink-primary focus-ring outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && <p className="text-[13px] text-traffic-red">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-sysblue hover:bg-sysbluedeep text-white text-[14px] font-medium rounded-lg py-2 transition-colors disabled:opacity-60"
            >
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-secondary text-[13px] mt-4">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <button className="text-sysblue hover:underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
