'use client'
import { useState, useEffect } from 'react'
import { Users, Activity, Clock, RefreshCw, LogOut } from 'lucide-react'
import { Sidebar } from '../components/AdminSidebar'
import { StatsCard } from '../components/AdminStatsCard'
import { AdminHeader } from '../components/AdminHeader'
import { useAdminAuth } from '../components/useAdminAuth'

interface User { email: string; name: string; plan: string; blocked: boolean; lastActiveAt: string; loginCount: number; messageCount: number; signedUpAt: string }

function timeAgo(iso: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function sessionDuration(iso: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000) % 60
  const hrs = Math.floor(diff / 3600000)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

export default function LiveActivity() {
  useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sessionFilter, setSessionFilter] = useState('all')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      const u = data.users || []
      setUsers(u)
      setFiltered(u)
    } finally { setLoading(false) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function handleSearch(q: string) {
    const lower = q.toLowerCase()
    setFiltered(users.filter(u => u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower)))
  }

  function isActiveWithAI(user: User) {
    if (!user.lastActiveAt) return false
    return Date.now() - new Date(user.lastActiveAt).getTime() < 60 * 60 * 1000 && user.messageCount > 0
  }

  function isActiveToday(user: User) {
    if (!user.lastActiveAt) return false
    return Date.now() - new Date(user.lastActiveAt).getTime() < 24 * 60 * 60 * 1000
  }

  async function handleBulkSignout() {
    if (selected.size === 0) return
    for (const email of selected) {
      await fetch('/api/admin/force-logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    }
    showToast(`${selected.size} user(s) signed out`)
    setSelected(new Set())
    fetchUsers()
  }

  const activeToday = users.filter(isActiveToday).length
  const activeWithAI = users.filter(isActiveWithAI).length

  const displayUsers = filtered.filter(u => {
    if (sessionFilter === 'active') return isActiveWithAI(u)
    if (sessionFilter === 'signed-in') return isActiveToday(u) && !isActiveWithAI(u)
    return true
  })

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#e5e7eb', overflow: 'hidden' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: '#1a2a4a', border: '1px solid #2a4a8a', borderRadius: 8, padding: '10px 18px', color: '#60a5fa', fontSize: 13, zIndex: 9999 }}>{toast}</div>}
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader title="Live Activity" onSearch={handleSearch} />
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <StatsCard title="Signed-in Accounts" value={activeToday} icon={<Users size={18} />} iconBg="#0f1a2e" subtext="+12 from last hour" />
            <StatsCard title="Currently using AI" value={activeWithAI} icon={<Activity size={18} />} iconBg="#0f2e1a" subtext="27.4% peak load" />
            <StatsCard title="Total Registered" value={users.length} icon={<Clock size={18} />} iconBg="#1a0f2e" />
          </div>

          {/* Live Session Monitor */}
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600, margin: 0 }}>Live Session Monitor</h2>
                <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>Real-time monitoring of all active Gmail-authenticated sessions.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchUsers} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Refresh
                </button>
                {selected.size > 0 && (
                  <button onClick={handleBulkSignout} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#7f1d1d', border: 'none', borderRadius: 6, color: '#fca5a5', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    <LogOut size={13} /> Bulk Sign-out ({selected.size})
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input placeholder="Search by Gmail address or user name..." style={{ flex: 1, background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 14px', color: '#e5e7eb', fontSize: 12, outline: 'none' }} onChange={e => handleSearch(e.target.value)} />
              <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px', color: '#e5e7eb', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Sessions</option>
                <option value="active">Active with AI</option>
                <option value="signed-in">Signed In</option>
              </select>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Loading...</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <th style={{ padding: '10px 16px', width: 40 }}>
                      <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(displayUsers.map(u => u.email)) : new Set())} style={{ cursor: 'pointer' }} />
                    </th>
                    {['User Account', 'Session Status', 'Signed In At', 'Duration', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', color: '#6b7280', fontWeight: 500, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map(user => {
                    const withAI = isActiveWithAI(user)
                    const today = isActiveToday(user)
                    return (
                      <tr key={user.email} style={{ borderBottom: '1px solid #161616' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <input type="checkbox" checked={selected.has(user.email)} onChange={e => {
                            const s = new Set(selected)
                            e.target.checked ? s.add(user.email) : s.delete(user.email)
                            setSelected(s)
                          }} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color: '#e5e7eb', fontWeight: 500 }}>{user.name || '—'}</div>
                              <div style={{ color: '#6b7280', fontSize: 11 }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {withAI ? (
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>Active with AI</span>
                          ) : today ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4ade80' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Signed-in
                            </span>
                          ) : (
                            <span style={{ color: '#6b7280', fontSize: 12 }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{sessionDuration(user.lastActiveAt)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={async () => {
                            await fetch('/api/admin/force-logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) })
                            showToast(`${user.name || user.email} signed out`)
                            fetchUsers()
                          }} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                            Sign out
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
