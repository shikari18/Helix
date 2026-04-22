'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Zap, Star, Award, TrendingUp } from 'lucide-react'
import { Sidebar } from '../components/AdminSidebar'
import { StatsCard } from '../components/AdminStatsCard'
import { AdminHeader } from '../components/AdminHeader'
import { useAdminAuth } from '../components/useAdminAuth'

interface User { email: string; name: string; plan: string; blocked: boolean; signedUpAt: string; lastActiveAt: string }

const PLANS = ['free', 'pro', 'proplus', 'ultra']
const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: '#1a1a1a', color: '#9ca3af' },
  pro: { bg: '#0f1a2e', color: '#60a5fa' },
  proplus: { bg: '#1a0f2e', color: '#a78bfa' },
  ultra: { bg: '#2a1f0a', color: '#fbbf24' },
}

export default function PlanManagement() {
  useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [confirmModal, setConfirmModal] = useState<{ user: User; newPlan: string } | null>(null)
  const [planFilter, setPlanFilter] = useState('all')

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
      setFiltered(data.users || [])
    } finally { setLoading(false) }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function handleSearch(q: string) {
    const lower = q.toLowerCase()
    const base = planFilter === 'all' ? users : users.filter(u => u.plan === planFilter)
    setFiltered(base.filter(u => u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower)))
  }

  function handlePlanFilter(p: string) {
    setPlanFilter(p)
    setFiltered(p === 'all' ? users : users.filter(u => u.plan === p))
  }

  async function applyPlanChange() {
    if (!confirmModal) return
    const { user, newPlan } = confirmModal
    await fetch('/api/admin/update-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, plan: newPlan })
    })
    setUsers(prev => prev.map(u => u.email === user.email ? { ...u, plan: newPlan } : u))
    setFiltered(prev => prev.map(u => u.email === user.email ? { ...u, plan: newPlan } : u))
    showToast(`Plan updated to ${newPlan.toUpperCase()} for ${user.name || user.email}`)
    setConfirmModal(null)
  }

  const counts = {
    total: users.length,
    pro: users.filter(u => u.plan === 'pro').length,
    proplus: users.filter(u => u.plan === 'proplus').length,
    ultra: users.filter(u => u.plan === 'ultra').length,
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#e5e7eb', overflow: 'hidden' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: '#1a2a4a', border: '1px solid #2a4a8a', borderRadius: 8, padding: '10px 18px', color: '#60a5fa', fontSize: 13, zIndex: 9999 }}>{toast}</div>}

      {/* Confirm Modal */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 14, padding: 32, width: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, background: '#1a2a4a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#60a5fa' }}><CreditCard size={20} /></div>
              <h3 style={{ color: '#f3f4f6', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Confirm Plan Adjustment</h3>
              <p style={{ color: '#9ca3af', fontSize: 13 }}>You are modifying the subscription tier for <strong style={{ color: '#e5e7eb' }}>{confirmModal.user.name || confirmModal.user.email}</strong>.</p>
            </div>
            <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 10, padding: '20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Current</div>
                <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: PLAN_COLORS[confirmModal.user.plan]?.bg || '#1a1a1a', color: PLAN_COLORS[confirmModal.user.plan]?.color || '#9ca3af', textTransform: 'uppercase' }}>{confirmModal.user.plan || 'free'}</span>
              </div>
              <div style={{ color: '#4b5563', fontSize: 20 }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Target</div>
                <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 700, background: PLAN_COLORS[confirmModal.newPlan]?.bg || '#1a1a1a', color: PLAN_COLORS[confirmModal.newPlan]?.color || '#9ca3af', textTransform: 'uppercase' }}>{confirmModal.newPlan}</span>
              </div>
            </div>
            <div style={{ background: '#0f1a0f', border: '1px solid #1a3a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#4ade80', fontSize: 14 }}>✓</span>
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, lineHeight: 1.6 }}>User will receive an automated email notification of this change.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent', color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={applyPlanChange} style={{ flex: 1, padding: '11px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}

      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader title="Plan Management" onSearch={handleSearch} />
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <StatsCard title="Total Users" value={counts.total} icon={<TrendingUp size={18} />} iconBg="#0f1a2e" />
            <StatsCard title="Pro Users" value={counts.pro} icon={<Award size={18} />} iconBg="#0f1a2e" subtext="+12% vs last month" />
            <StatsCard title="Pro+ Users" value={counts.proplus} icon={<Star size={18} />} iconBg="#1a0f2e" />
            <StatsCard title="Ultra Users" value={counts.ultra} icon={<Zap size={18} />} iconBg="#2a1f0a" subtext="+24% vs last month" />
          </div>

          {/* Table */}
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600, margin: 0 }}>User Subscriptions</h2>
                <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>Modify plans and view subscription details</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Filter by email..." style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '7px 12px', color: '#e5e7eb', fontSize: 12, outline: 'none', width: 180 }} onChange={e => handleSearch(e.target.value)} />
                <select value={planFilter} onChange={e => handlePlanFilter(e.target.value)} style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '7px 12px', color: '#e5e7eb', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                  <option value="all">Plan: All</option>
                  {PLANS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Loading...</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                    {['User', 'Plan', 'Billing', 'Renewal Date', 'Account Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', color: '#6b7280', fontWeight: 500, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.email} style={{ borderBottom: '1px solid #161616' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ color: '#e5e7eb', fontWeight: 500 }}>{user.name || '—'}</div>
                            <div style={{ color: '#6b7280', fontSize: 11 }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: PLAN_COLORS[user.plan]?.bg || '#1a1a1a', color: PLAN_COLORS[user.plan]?.color || '#9ca3af', textTransform: 'uppercase' }}>{user.plan || 'free'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9ca3af' }}>Monthly</td>
                      <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{user.lastActiveAt ? new Date(new Date(user.lastActiveAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: user.blocked ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)', color: user.blocked ? '#f87171' : '#4ade80' }}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={user.plan || 'free'}
                          onChange={e => setConfirmModal({ user, newPlan: e.target.value })}
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, padding: '5px 10px', color: '#e5e7eb', fontSize: 12, cursor: 'pointer', outline: 'none' }}
                        >
                          {PLANS.map(p => <option key={p} value={p} style={{ background: '#1a1a1a' }}>Change to {p.toUpperCase()}</option>)}
                        </select>
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
