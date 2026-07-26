import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Admin picks from everyone who has already signed up on the site, sets their
// role (Designer or Client), and toggles exactly which brands they can see.
export default function TeamAccess({ clients }) {
  const [people, setPeople] = useState([])
  const [memberships, setMemberships] = useState([]) // { client_id, user_id }
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: profiles }, { data: members }] = await Promise.all([
      supabase.from('profiles').select('*').neq('role', 'admin').order('created_at'),
      supabase.from('client_members').select('client_id, user_id'),
    ])
    setPeople(profiles || [])
    setMemberships(members || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function setRole(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    load()
  }

  function hasAccess(userId, clientId) {
    return memberships.some((m) => m.user_id === userId && m.client_id === clientId)
  }

  async function toggleAccess(userId, clientId) {
    if (hasAccess(userId, clientId)) {
      await supabase.from('client_members').delete().eq('user_id', userId).eq('client_id', clientId)
    } else {
      await supabase.from('client_members').insert({ user_id: userId, client_id: clientId })
    }
    load()
  }

  if (loading) return <p className="text-ink-secondary text-[13px]">Loading…</p>

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-[28px] text-ink-primary mb-1">Team & Access</h1>
      <p className="text-ink-secondary text-[13px] mb-6">
        Ask people to create an account on the site first — they'll show up here. Then set their role
        and tick which brands they can see. Nobody sees a brand unless it's ticked.
      </p>

      {people.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-card py-10 text-center">
          <p className="text-ink-secondary text-[13px]">No one has signed up yet.</p>
        </div>
      ) : (
        <div className="mac-window overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left px-4 py-3 label-caps">Person</th>
                <th className="text-left px-4 py-3 label-caps">Role</th>
                {clients.map((c) => (
                  <th key={c.id} className="text-center px-3 py-3 label-caps whitespace-nowrap">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b border-hairline last:border-0 hover:bg-canvas/60 dark:hover:bg-[#232327]">
                  <td className="px-4 py-3">
                    <p className="text-ink-primary font-medium">{p.full_name || 'Unnamed'}</p>
                    <p className="text-ink-tertiary text-[12px]">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.role}
                      onChange={(e) => setRole(p.id, e.target.value)}
                      className="bg-canvas dark:bg-[#232327] border border-hairline rounded-md px-2 py-1 text-[13px] focus-ring outline-none"
                    >
                      <option value="client">Client</option>
                      <option value="team">Designer</option>
                    </select>
                  </td>
                  {clients.map((c) => (
                    <td key={c.id} className="text-center px-3 py-3">
                      <input
                        type="checkbox"
                        checked={hasAccess(p.id, c.id)}
                        onChange={() => toggleAccess(p.id, c.id)}
                        className="w-4 h-4 accent-sysblue cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
