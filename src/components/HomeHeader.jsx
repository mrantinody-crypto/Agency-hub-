import { useEffect, useState } from 'react'

const QUOTES = [
  'Momentum beats mood when the deadline is close.',
  'Great work ships with calm clarity.',
  'The best ideas keep moving.',
  'Sharp craft turns pressure into polish.',
  'A clear week makes bold work possible.',
  'Tiny wins stack into a strong launch.',
  'Creative momentum is a habit, not a mood.',
  'The deadline is a drumbeat, not a wall.',
  'Make the next move beautifully.',
  'Good systems create room for great ideas.',
  'Focus is the fastest shortcut.',
  'The strongest brands feel effortless because the work is precise.',
  'Keep the energy high and the details tighter.',
  'Momentum is built one thoughtful task at a time.',
  'A calm team makes ambitious work feel light.'
]

function formatClock(date) {
  const hours = date.getHours() % 12 || 12
  const mins = String(date.getMinutes()).padStart(2, '0')
  const suffix = date.getHours() >= 12 ? 'PM' : 'AM'
  return `${String(hours).padStart(2, '0')}:${mins} ${suffix}`
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeHeader({ name = 'there' }) {
  const [now, setNow] = useState(new Date())
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const firstName = name.split(' ')[0] || 'friend'

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-[#0A84FF] via-[#2D5BFF] to-[#6C4CE0] p-6 text-white shadow-[0_25px_70px_-24px_rgba(69,39,191,0.7)] md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_38%)]" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-white/80">
            Creative control room
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-[0.32em] text-white/70">{formatClock(now)}</p>
            <h1 className="font-display text-[28px] leading-tight md:text-[34px]">
              {getGreeting(now.getHours())}, {firstName}.
            </h1>
          </div>
          <p className="text-[14px] leading-6 text-white/85">{quote}</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Momentum</p>
          <p className="mt-1 text-[15px] font-medium">Keep the work moving.</p>
        </div>
      </div>
    </section>
  )
}
