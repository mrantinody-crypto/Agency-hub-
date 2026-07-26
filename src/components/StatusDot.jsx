// Signature element: status shown as a macOS "traffic light" dot + label,
// echoing the window-control dots used throughout the app's chrome.
const MAP = {
  pending: { color: '#FF5F57', label: 'Pending' },
  in_progress: { color: '#FEBC2E', label: 'In progress' },
  done: { color: '#28C840', label: 'Done' },
  planned: { color: '#FEBC2E', label: 'Planned' },
  posted: { color: '#28C840', label: 'Posted' },
  active: { color: '#28C840', label: 'Active' },
  paused: { color: '#FEBC2E', label: 'Paused' },
  archived: { color: '#9A9AA0', label: 'Archived' },
}

export default function StatusDot({ status, onClick }) {
  const cfg = MAP[status] || { color: '#9A9AA0', label: status }
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className="traffic-dot" style={{ background: cfg.color }} />
      <span className="text-[13px] text-ink-secondary">{cfg.label}</span>
    </Tag>
  )
}
