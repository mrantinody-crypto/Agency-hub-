export default async function handler(req, res) {
  const secret = req.query.secret || req.headers['x-cron-secret']
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.DIGEST_FROM_EMAIL || 'onboarding@resend.dev'

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  async function sb(path) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
    return r.json()
  }

  async function sendEmail(to, subject, html) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  const admins = await sb('profiles?role=eq.admin&select=email,full_name')
  const tasks = await sb('tasks?select=title,status,due_date,client_id,clients(name),profiles:assigned_to(full_name)')
  const events = await sb(`calendar_events?scheduled_date=eq.${today}&select=title,platform,client_id,clients(name)`)
  const members = await sb('client_members?select=user_id,client_id,profiles(email,full_name,role),clients(name)')

  const pending = tasks.filter((t) => t.status !== 'done')
  const overdue = pending.filter((t) => t.due_date && t.due_date < today)
  const doneRecent = tasks.filter((t) => t.status === 'done')

  const line = (t) => {
    const who = t.profiles?.full_name ? ` — ${t.profiles.full_name}` : ' — unassigned'
    const flag = t.due_date && t.due_date < today ? ' ⚠️ OVERDUE' : ''
    const due = t.due_date ? `, due ${t.due_date}` : ''
    return `<li><b>${t.clients?.name ?? 'Brand'}</b>: ${t.title} (${t.status}${due})${who}${flag}</li>`
  }

  for (const admin of admins || []) {
    if (!admin.email) continue
    const html = `
      <h2>Agency Hub — Daily Digest (${today})</h2>
      <h3>⚠️ Overdue (${overdue.length})</h3>
      <ul>${overdue.map(line).join('') || '<li>None. 🎉</li>'}</ul>
      <h3>Scheduled today</h3>
      <ul>${(events || []).map((e) => `<li><b>${e.clients?.name ?? 'Brand'}</b> — ${e.title} (${e.platform ?? ''})</li>`).join('') || '<li>Nothing scheduled.</li>'}</ul>
      <h3>All pending</h3>
      <ul>${pending.map(line).join('') || '<li>Nothing pending. 🎉</li>'}</ul>
      <h3>Completed</h3>
      <ul>${doneRecent.map(line).join('') || '<li>Nothing yet.</li>'}</ul>
    `
    await sendEmail(admin.email, `Agency Hub — Daily Digest (${today})`, html)
  }

  const byUser = {}
  for (const m of members || []) {
    if (!byUser[m.user_id]) byUser[m.user_id] = []
    byUser[m.user_id].push(m)
  }

  for (const userId in byUser) {
    const rows = byUser[userId]
    const person = rows[0].profiles
    if (!person?.email) continue
    const clientIds = rows.map((r) => r.client_id)
    const myPending = pending.filter((t) => clientIds.includes(t.client_id))
    const myDone = doneRecent.filter((t) => clientIds.includes(t.client_id))
    const myEvents = (events || []).filter((e) => clientIds.includes(e.client_id))
    const brandNames = rows.map((r) => r.clients?.name).join(', ')

    const html = `
      <h2>${brandNames} — Daily Update (${today})</h2>
      <h3>Scheduled today</h3>
      <ul>${myEvents.map((e) => `<li>${e.title} (${e.platform ?? ''})</li>`).join('') || '<li>Nothing scheduled.</li>'}</ul>
      <h3>Pending / left to do</h3>
      <ul>${myPending.map(line).join('') || '<li>All caught up. 🎉</li>'}</ul>
      ${person.role === 'team' ? `<h3>Completed</h3><ul>${myDone.map(line).join('') || '<li>Nothing yet.</li>'}</ul>` : ''}
    `
    await sendEmail(person.email, `${brandNames} — Daily Update (${today})`, html)
  }

  return res.status(200).json({ ok: true, sent: (admins || []).length + Object.keys(byUser).length })
}