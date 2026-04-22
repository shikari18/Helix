'use client'
import { useState, useEffect } from 'react'
import { Send, Users } from 'lucide-react'
import { Sidebar } from '../components/AdminSidebar'
import { AdminHeader } from '../components/AdminHeader'
import { useAdminAuth } from '../components/useAdminAuth'

interface User { email: string; name: string }
interface Broadcast { id: string; subject: string; body: string; sentAt: string; recipients: number }

export default function Messaging() {
  useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [target, setTarget] = useState<'all' | 'specific'>('all')
  const [selectedEmail, setSelectedEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || []))
    const saved = localStorage.getItem('helix_admin_broadcasts')
    if (saved) setBroadcasts(JSON.parse(saved))
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    try {
      const recipients = target === 'all' ? users.map(u => u.email) : [selectedEmail]
      for (const to of recipients) {
        await fetch('/api/admin/send-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body })
        })
      }
      const newBroadcast: Broadcast = { id: Date.now().toString(), subject, body, sentAt: new Date().toLocaleString(), recipients: recipients.length }
      const updated = [newBroadcast, ...broadcasts]
      setBroadcasts(updated)
      localStorage.setItem('helix_admin_broadcasts', JSON.stringify(updated))
      setSubject(''); setBody('')
      showToast(`Email sent to ${recipients.length} recipient(s)`)
    } catch { showToast('Failed to send email') }
    finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#e5e7eb', overflow: 'hidden' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: '#1a2a4a', border: '1px solid #2a4a8a', borderRadius: 8, padding: '10px 18px', color: '#60a5fa', fontSize: 13, zIndex: 9999 }}>{toast}</div>}
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader title="Messaging" />
        <div style={{ flex: 1, display: 'flex', padding: '24px 32px', gap: 24, overflowY: 'auto' }}>
          {/* Compose */}
          <div style={{ flex: 1, maxWidth: 560 }}>
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24 }}>
              <h2 style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Compose Broadcast</h2>
              <form onSubmit={handleSend}>
                {/* Target */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Recipients</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['all', 'specific'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setTarget(t)} style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid', borderColor: target === t ? '#2563eb' : '#2a2a2a', background: target === t ? '#1a2a4a' : 'transparent', color: target === t ? '#60a5fa' : '#9ca3af', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                        {t === 'all' ? `All Users (${users.length})` : 'Specific User'}
                      </button>
                    ))}
                  </div>
                </div>
                {target === 'specific' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Select User</label>
                    <select value={selectedEmail} onChange={e => setSelectedEmail(e.target.value)} required={target === 'specific'} style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none' }}>
                      <option value="">Select a user...</option>
                      {users.map(u => <option key={u.email} value={u.email}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Subject</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Email subject..." style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Message</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} required rows={6} placeholder="Write your message..." style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={sending} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: sending ? '#1e3a6b' : '#2563eb', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer' }}>
                  <Send size={14} /> {sending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </form>
            </div>
          </div>

          {/* Recent */}
          <div style={{ flex: 1, paddingRight: 32 }}>
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24 }}>
              <h2 style={{ color: '#f3f4f6', fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Recent Broadcasts</h2>
              {broadcasts.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No broadcasts sent yet</div>
              ) : broadcasts.map(b => (
                <div key={b.id} style={{ padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500 }}>{b.subject}</div>
                    <div style={{ color: '#6b7280', fontSize: 11 }}>{b.sentAt}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Users size={11} style={{ color: '#6b7280' }} />
                    <span style={{ color: '#6b7280', fontSize: 11 }}>{b.recipients} recipient(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
