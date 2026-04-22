'use client'
import { useState, useEffect } from 'react'
import { Shield, Lock, Ban, Trash2, MoreHorizontal } from 'lucide-react'
import { Sidebar } from './components/AdminSidebar'
import { StatsCard } from './components/AdminStatsCard'
import { AdminHeader } from './components/AdminHeader'
import { useAdminAuth } from './components/useAdminAuth'

interface User {
  email: string
  name: string
  plan: string
  blocked: boolean
  signedUpAt: string
  lastActiveAt: string
  loginCount: number
  messageCount: number
}

export default function AccessControl() {
  useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-btn]')) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])
  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
      setFiltered(data.users || [])
    } catch { showToast('Failed to load users') }
    finally { setLoading(false) }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSearch(q: string) {
    const lower = q.toLowerCase()
    setFiltered(users.filter(u => u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower)))
  }

  async function blockUser(email: string) {
    await fetch('/api/admin/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setUsers(prev => prev.map(u => u.email === email ? { ...u, blocked: true } : u))
    setFiltered(prev => prev.map(u => u.email === email ? { ...u, blocked: true } : u))
    showToast('User blocked')
    setOpenMenu(null)
  }

  async function unblockUser(email: string) {
    await fetch('/api/admin/unblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setUsers(prev => prev.map(u => u.email === email ? { ...u, blocked: false } : u))
    setFiltered(prev => prev.map(u => u.email === email ? { ...u, blocked: false } : u))
    showToast('User unblocked')
    setOpenMenu(null)
  }

  async function deleteUser(email: string) {
    await fetch('/api/admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    setUsers(prev => prev.filter(u => u.email !== email))
    setFiltered(prev => prev.filter(u => u.email !== email))
    showToast('User deleted')
    setOpenMenu(null)
  }

  const total = users.length
  const blocked = users.filter(u => u.blocked).length
  const active = users.filter(u => !u.blocked).length

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#e5e7eb', overflow: 'hidden' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1a2a4a', border: '1px solid #2a4a8a', borderRadius: 8, padding: '10px 18px', color: '#60a5fa', fontSize: 13, zIndex: 9999 }}>{toast}</div>
      )}
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminHeader title="Access Control" onSearch={handleSearch} />
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <StatsCard title="Total Gmail Accounts" value={total} icon={<Shield size={18} />} iconBg="#0f1a2e" />
            <StatsCard title="Active Sessions" value={active} icon={<Lock size={18} />} iconBg="#0f2e1a" subtext="+12 today" />
            <StatsCard title="Blocked Accounts" value={blocked} icon={<Ban size={18} />} iconBg="#2e0f0f" />
          </div>

          {/* Table */}
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f1f1f' }}>
              <h2 style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600, margin: 0 }}>Gmail Accounts</h2>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>All registered accounts and their access status</p>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>No accounts found</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                    {['User', 'Plan', 'Logins', 'Messages', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', color: '#6b7280', fontWeight: 500, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.email} style={{ borderBottom: '1px solid #161616', background: user.blocked ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.blocked ? '#3a1a1a' : '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user.blocked ? '#f87171' : '#60a5fa', fontWeight: 700, fontSize: 13 }}>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#e5e7eb', fontWeight: 500 }}>{user.name || '—'}</div>
                            <div style={{ color: '#6b7280', fontSize: 11 }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: user.plan === 'ultra' ? '#2a1f0a' : user.plan === 'proplus' ? '#1a0f2e' : user.plan === 'pro' ? '#0f1a2e' : '#1a1a1a', color: user.plan === 'ultra' ? '#fbbf24' : user.plan === 'proplus' ? '#a78bfa' : user.plan === 'pro' ? '#60a5fa' : '#9ca3af', textTransform: 'uppercase' }}>
                          {user.plan || 'free'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{user.loginCount || 0}</td>
                      <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{user.messageCount || 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: user.blocked ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)', color: user.blocked ? '#f87171' : '#4ade80' }}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', position: 'relative' }}>
                        <button
                          data-menu-btn="true"
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            const dropdownHeight = 90
                            const spaceBelow = window.innerHeight - rect.bottom
                            const top = spaceBelow < dropdownHeight ? rect.top - dropdownHeight : rect.bottom + 4
                            setMenuPos({ top, right: window.innerWidth - rect.right })
                            setOpenMenu(openMenu === user.email ? null : user.email)
                          }}
                          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenu === user.email && (
                          <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, zIndex: 9999, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            {user.blocked ? (
                              <button onClick={() => unblockUser(user.email)} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#4ade80', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>Unblock</button>
                            ) : (
                              <button onClick={() => blockUser(user.email)} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>Block</button>
                            )}
                            <button onClick={() => deleteUser(user.email)} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer', textAlign: 'left', borderTop: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
