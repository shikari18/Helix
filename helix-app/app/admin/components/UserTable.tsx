'use client'

import { UserRecord } from '../types'

interface UserTableProps {
  users: UserRecord[]
  onBlock: (email: string) => void
  onUnblock: (email: string) => void
  onSendEmail: (user: UserRecord) => void
  onUpdatePlan: (email: string, plan: string) => void
  searchQuery: string
  filterStatus: 'all' | 'active' | 'blocked'
}

const PLAN_COLORS: Record<string, string> = {
  free: '#555',
  pro: '#1a6fb5',
  proplus: '#7c3aed',
  ultra: '#b45309',
}

const PLANS = ['free', 'pro', 'proplus', 'ultra']

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(iso: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function UserTable({
  users,
  onBlock,
  onUnblock,
  onSendEmail,
  onUpdatePlan,
  searchQuery,
  filterStatus,
}: UserTableProps) {
  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'blocked' && u.blocked) ||
      (filterStatus === 'active' && !u.blocked)
    return matchesSearch && matchesStatus
  })

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#555', padding: '48px 0' }}>
        No users match your filters.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2a2a2a', color: '#666', textAlign: 'left' }}>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>User</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Plan</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Signed Up</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Last Active</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Messages</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Logins</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Status</th>
            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr
              key={user.email}
              style={{
                borderBottom: '1px solid #1e1e1e',
                background: user.blocked ? 'rgba(180,40,40,0.07)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Avatar + email + name */}
              <td style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: user.blocked ? '#5a1a1a' : '#1e3a5f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: user.blocked ? '#a06060' : '#e0e0e0', fontWeight: 500 }}>{user.name || '—'}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>{user.email}</div>
                  </div>
                </div>
              </td>

              {/* Plan badge + selector */}
              <td style={{ padding: '12px 12px' }}>
                <select
                  value={user.plan}
                  onChange={(e) => onUpdatePlan(user.email, e.target.value)}
                  style={{
                    background: PLAN_COLORS[user.plan] || '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p} style={{ background: '#1a1a1a' }}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
              </td>

              <td style={{ padding: '12px 12px', color: '#888' }}>{formatDate(user.signedUpAt)}</td>
              <td style={{ padding: '12px 12px', color: '#888' }}>{timeAgo(user.lastActiveAt)}</td>
              <td style={{ padding: '12px 12px', color: '#ccc' }}>{user.messageCount.toLocaleString()}</td>
              <td style={{ padding: '12px 12px', color: '#ccc' }}>{user.loginCount.toLocaleString()}</td>

              {/* Status */}
              <td style={{ padding: '12px 12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: user.blocked ? 'rgba(180,40,40,0.25)' : 'rgba(40,160,80,0.2)',
                    color: user.blocked ? '#f87171' : '#4ade80',
                  }}
                >
                  {user.blocked ? 'Blocked' : 'Active'}
                </span>
              </td>

              {/* Actions */}
              <td style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => (user.blocked ? onUnblock(user.email) : onBlock(user.email))}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      background: user.blocked ? 'rgba(40,160,80,0.2)' : 'rgba(180,40,40,0.2)',
                      color: user.blocked ? '#4ade80' : '#f87171',
                    }}
                  >
                    {user.blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={() => onSendEmail(user)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'rgba(100,100,255,0.15)',
                      color: '#a5b4fc',
                    }}
                  >
                    Email
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
