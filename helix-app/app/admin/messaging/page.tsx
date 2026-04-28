'use client'
import { useState, useEffect } from 'react'
import { 
  MessageSquare, Send, Bell, Users, 
  Terminal, ArrowLeft, History,
  Clock, CheckCircle, Calendar, UserCheck,
  Search, Filter, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../components/useAdminAuth'
import AdminHeader from '../components/AdminHeader'

interface User { email: string; name: string; lastActiveAt: string; signedUpAt: string; }

export default function AdminMessaging() {
  useAdminAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [targetType, setTargetType] = useState('all')
  const [selectedUser, setSelectedUser] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || []))
  }, [])

  const handleSend = async () => {
    if (!message) return
    setSending(true)
    try {
      await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetEmail: selectedUser, dateRange, message })
      })
      alert('Transmission dispatched successfully.')
      setMessage('')
    } catch (e) {
      alert('Failed to dispatch transmission.')
    } finally {
      setSending(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <AdminHeader />

      <style>{`
        .glass-panel { background: #111; border: 1px solid #1a1a1a; border-radius: 20px; padding: 30px; }
        .input-dark { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 10px; padding: 12px; color: #fff; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; }
        .input-dark:focus { border-color: #333; }
        .selector-btn { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #1a1a1a; background: #0d0d0d; color: #444; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .selector-btn.active { background: #fff; color: #000; border-color: #fff; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 30, maxWidth: 1400, margin: '0 auto' }}>
        
        <div className="glass-panel">
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#444', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 16 }}>1. SELECT_TARGETING_PROTOCOL</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={`selector-btn ${targetType === 'all' ? 'active' : ''}`} onClick={() => setTargetType('all')}><Users size={14} /> ALL_ENTITIES</button>
              <button className={`selector-btn ${targetType === 'recent' ? 'active' : ''}`} onClick={() => setTargetType('recent')}><Clock size={14} /> RECENT_LOGINS</button>
              <button className={`selector-btn ${targetType === 'date' ? 'active' : ''}`} onClick={() => setTargetType('date')}><Calendar size={14} /> BY_DATE</button>
              <button className={`selector-btn ${targetType === 'specific' ? 'active' : ''}`} onClick={() => setTargetType('specific')}><UserCheck size={14} /> SPECIFIC_GMAIL</button>
            </div>
          </div>

          {targetType === 'specific' && (
            <div style={{ marginBottom: 32, background: '#0d0d0d', padding: 20, borderRadius: 12, border: '1px solid #1a1a1a' }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#444' }} />
                <input className="input-dark" placeholder="Search Gmail..." style={{ paddingLeft: 36 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                {filteredUsers.slice(0, 10).map(u => (
                  <div key={u.email} onClick={() => setSelectedUser(u.email)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: selectedUser === u.email ? '#fff' : 'transparent', color: selectedUser === u.email ? '#000' : '#888' }}>
                    {u.email}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, color: '#444', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 16 }}>2. MESSAGE_PAYLOAD</div>
            <textarea className="input-dark" style={{ minHeight: 180, resize: 'vertical' }} placeholder="Construct transmission..." value={message} onChange={e => setMessage(e.target.value)} />
          </div>

          <button disabled={sending || !message} onClick={handleSend} style={{ width: '100%', padding: 20, borderRadius: 12, border: 'none', background: '#fff', color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: (sending || !message) ? 0.5 : 1 }}>
            {sending ? 'EXECUTING...' : 'DISPATCH_TRANSMISSION_>>'}
            {!sending && <Send size={18} />}
          </button>
        </div>

        <div className="glass-panel" style={{ flex: 1 }}>
             <div style={{ fontSize: 11, color: '#444', fontWeight: 800, marginBottom: 20 }}>ACTIVE_NODE_PREVIEW</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {users.slice(0, 8).map(u => (
                  <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d0d0d', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: '#fff' }}>{u.email}</div>
                    <div style={{ fontSize: 10, color: '#444' }}>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : 'Inactive'}</div>
                  </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  )
}
