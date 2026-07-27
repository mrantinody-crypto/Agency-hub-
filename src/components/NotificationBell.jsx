import { useMemo, useState } from 'react'

function formatDateLabel(dateStr) {
  if (!dateStr) return 'No date'
  const date = new Date(`${dateStr}T00:00:00`)
  const today = new Date()
  const diff = Math.round((date - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000)
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`
  return `In ${diff} day${diff === 1 ? '' : 's'}`
}

export default function NotificationBell({ tasks = [] }) {
  const [open, setOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const urgentItems = useMemo(() => {
    return tasks.filter((task) => task.status !== 'done' && task.due_date && (task.due_date < today || task.due_date === today))
  }, [tasks, today])

  const overdue = urgentItems.filter((task) => task.due_date < today)
  const dueToday = urgentItems.filter((task) => task.due_date === today)
  const hasItems = overdue.length > 0 || dueToday.length > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white/80 text-[18px] shadow-sm transition hover:bg-white"
        aria-label="Notifications"
      >
        🔔
        {hasItems && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-traffic-red" />}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-hairline bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-ink-secondary">Urgent</p>
            <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-ink-tertiary">Close</button>
          </div>

          {hasItems ? (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {overdue.map((task) => (
                <div key={`overdue-${task.id}`} className="rounded-xl border border-traffic-red/20 bg-traffic-red/10 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-ink-primary">{task.title}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-traffic-red">Overdue</span>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-secondary">{task.clients?.name || 'Brand'} · {formatDateLabel(task.due_date)}</p>
                </div>
              ))}
              {dueToday.map((task) => (
                <div key={`today-${task.id}`} className="rounded-xl border border-amber-300/40 bg-amber-50 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-ink-primary">{task.title}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">Due today</span>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-secondary">{task.clients?.name || 'Brand'} · {formatDateLabel(task.due_date)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-[13px] text-ink-secondary">
              Nothing urgent.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
