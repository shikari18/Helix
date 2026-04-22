'use client'
import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, Download } from 'lucide-react'
import { Sidebar } from '../components/AdminSidebar'
import { AdminHeader } from '../components/AdminHeader'
import { useAdminAuth } from '../components/useAdminAuth'

interface Feedback {
  id: string
  email: string
  name: string
  subject: string
  message: string
  type: 'bug' | 'suggestion' | 'critical' | 'general'
  resolved: boolean
  createdAt: string
}

const TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Critical' },
  bug: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', label: 'UI Bug' },
  suggestion: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', label: 'Suggestion' },
  general: { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', label: 'General' },
}

export default function FeedbackPage() {
  useAdminAuth()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [selected, setSelected] = useState<Feedback | null>(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('helix_admin_feedback')
    if (saved) {
      setFeedbacks(JSON.parse(saved))
    } else {
      // Seed with empty state
      setFeedbacks([])
    }
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function markResolved(id: string) {
    const updated = feedbacks.map(f => f.id === id ? { ...f, resolved: true } : f)
    setFeedbacks(updated)
    localStorage.setItem('helix_admin_feedback', JSON.stringify(updated))
    if (selected?.id === id) setSelected({ ...selected, resolved: true })
    showToast('Marked as resolved')
  }

  function exportCSV() {
    const rows = [['ID', 'Email', 'Name', 'Subject', 'Type', 'Resolved', 'Date']]
    feedbacks.forEach(f => rows.push([f.id, f.email, f.name, f.subject, f.type, f.resolved ? 'Yes' : 'No', f.createdAt]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'feedback.csv'; a.click()
  }

  const filtered = feedbacks.filter(f =>
    f.email.toLowerCase().includes(search.toLowerCase()) ||
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.subject.toLowerCase().includes(search.toLowerCase())
  )

  const total = feedbacks.length
  const unread = feedbacks.filter(f => !f.resolved).length
  const critical = feedbacks.filter(f => f.type === 'critical').length

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#e5e7eb', overflow: 'hidden' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: '#1a2a4a', border: '1px solid #2a4a8a', borderRadius: 8, padding: '10px 18px', color: '#60a5fa', fontSize: 13, zIndex: 9999 }}>{toast}</div>}
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader title="Feedback Inbox" onSearch={setSearch} />

        {/* Sub-header */}
        <div style={{ padding: '10px 32px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a' }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#9ca3af' }}>
            <span>Total: <strong style={{ color: '#e5e7eb' }}>{total}</strong></span>
            <span>Unread: <strong style={{ color: '#60a5fa' }}>{unread}</strong></span>
            <span>Critical: <strong style={{ color: '#f87171' }}>{critical}</strong></span>
          </div>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: list */}
          <div style={{ width: 320, borderRight: '1px solid #1f1f1f', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..." style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px', color: '#e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7280', fontSize: 13 }}>
                <MessageCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                No feedback yet
              </div>
            ) : filtered.map(f => (
              <div key={f.id} onClick={() => setSelected(f)} style={{
                padding: '14px 16px', borderBottom: '1px solid #161616', cursor: 'pointer',
                background: selected?.id === f.id ? '#1a2a4a' : 'transparent',
                transition: 'background 0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                    {(f.name || f.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name || f.email}</div>
                    <div style={{ color: '#6b7280', fontSize: 10 }}>{f.email}</div>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 10, flexShrink: 0 }}>{f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ''}</div>
                </div>
                <div style={{ color: '#9ca3af', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{f.subject}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: TYPE_COLORS[f.type]?.bg, color: TYPE_COLORS[f.type]?.color }}>{TYPE_COLORS[f.type]?.label}</span>
                  {f.resolved && <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}>Resolved</span>}
                </div>
              </div>
            ))}
            {feedbacks.length === 0 && (
              <div style={{ padding: '16px', borderTop: '1px solid #1a1a1a', textAlign: 'center', color: '#4b5563', fontSize: 11 }}>END OF MESSAGES</div>
            )}
          </div>

          {/* Right: detail */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
            {!selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                <MessageCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>Select a message to view details</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700, fontSize: 18 }}>
                    {(selected.name || selected.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f3f4f6', fontSize: 16, fontWeight: 600 }}>{selected.name || '—'}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{selected.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!selected.resolved && (
                      <button onClick={() => markResolved(selected.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
                        <CheckCircle size={13} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
                <h2 style={{ color: '#f3f4f6', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{selected.subject}</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: TYPE_COLORS[selected.type]?.bg, color: TYPE_COLORS[selected.type]?.color }}>{TYPE_COLORS[selected.type]?.label}</span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>Received {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</span>
                </div>
                <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '20px', marginBottom: 24, color: '#d1d5db', fontSize: 14, lineHeight: 1.7 }}>
                  {selected.message}
                </div>
                {selected.resolved && (
                  <div style={{ background: '#0f2e0f', border: '1px solid #1a4a1a', borderRadius: 8, padding: '12px 16px', color: '#4ade80', fontSize: 13 }}>
                    ✓ This feedback has been marked as resolved.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
