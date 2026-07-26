// Supabase Edge Function: send-digest
// Runs on a daily schedule (see README Part 7).
// Emails admin (everything), each designer (their assigned brands + tasks),
// and each client (their brand's pending items) — so everyone knows what's
// pending, what's left, and what's been completed.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendKey = Deno.env.get('RESEND_API_KEY')!
const fromEmail = Deno.env.get('DIGEST_FROM_EMAIL') || 'digest@yourdomain.com'

const supabase = createClient(supabaseUrl, serviceKey)

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  })
}

function taskLine(t: any) {
  const who = t.profiles?.full_name ? ` — ${t.profiles.full_name}` : ' — unassigned'
  const due = t.due_date ? `, due ${t.due_date}` : ''
  return `<li><b>${t.clients?.name ?? 'Brand'}</b>: ${t.title} (${t.status}${due})${who}</li>`
}

Deno.serve(async () => {
  const today = new Date().toISOString().slice(0, 10)

  const { data: admins } = await supabase.from('profiles').select('id, email, full_name').eq('role', 'admin')
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('title, status, due_date, client_id, clients(name), profiles:assigned_to(full_name)')
  const { data: todaysEvents } = await supabase
    .from('calendar_events')
    .select('title, platform, client_id, clients(name)')
    .eq('scheduled_date', today)

  const pending = (allTasks ?? []).filter((t) => t.status !== 'done')
  const doneRecent = (allTasks ?? []).filter((t) => t.status === 'done')

  // Admin — full picture, including what each designer has completed
  for (const admin of admins ?? []) {
    if (!admin.email) continue
    const html = `
      <h2>Agency Hub — Daily Digest (${today})</h2>
      <h3>Scheduled today</h3>
      <ul>${(todaysEvents ?? []).map((e) => `<li><b>${e.clients?.name ?? 'Brand'}</b> — ${e.title} (${e.platform ?? ''})</li>`).join('') || '<li>Nothing scheduled.</li>'}</ul>
      <h3>Pending / left to do</h3>
      <ul>${pending.map(taskLine).join('') || '<li>Nothing pending. 🎉</li>'}</ul>
      <h3>Completed</h3>
      <ul>${doneRecent.map(taskLine).join('') || '<li>Nothing marked done yet.</li>'}</ul>
    `
    await sendEmail(admin.email, `Agency Hub — Daily Digest (${today})`, html)
  }

  // Designers + Clients — only their own brand(s)
  const { data: members } = await supabase
    .from('client_members')
    .select('user_id, client_id, profiles(email, full_name, role), clients(name)')

  const byUser = new Map<string, any[]>()
  for (const m of members ?? []) {
    if (!byUser.has(m.user_id)) byUser.set(m.user_id, [])
    byUser.get(m.user_id)!.push(m)
  }

  for (const [, rows] of byUser) {
    const person = rows[0].profiles
    if (!person?.email) continue
    const clientIds = rows.map((r: any) => r.client_id)
    const myPending = pending.filter((t) => clientIds.includes(t.client_id))
    const myDone = doneRecent.filter((t) => clientIds.includes(t.client_id))
    const myEvents = (todaysEvents ?? []).filter((e) => clientIds.includes(e.client_id))
    const brandNames = rows.map((r: any) => r.clients?.name).join(', ')

    const html = `
      <h2>${brandNames} — Daily Update (${today})</h2>
      <h3>Scheduled today</h3>
      <ul>${myEvents.map((e) => `<li>${e.title} (${e.platform ?? ''})</li>`).join('') || '<li>Nothing scheduled.</li>'}</ul>
      <h3>Pending / left to do</h3>
      <ul>${myPending.map(taskLine).join('') || '<li>All caught up. 🎉</li>'}</ul>
      ${person.role === 'team' ? `<h3>Completed</h3><ul>${myDone.map(taskLine).join('') || '<li>Nothing yet.</li>'}</ul>` : ''}
    `
    await sendEmail(person.email, `${brandNames} — Daily Update (${today})`, html)
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
