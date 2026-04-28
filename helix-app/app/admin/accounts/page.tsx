'use client'
import { useState, useEffect } from 'react'
import { 
  Users, Search, Filter, MoreHorizontal, 
  Shield, Ban, Trash2, Calendar, Clock,
  CheckCircle2, XCircle, RefreshCw, AlertTriangle, UserPlus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../components/useAdminAuth'
import AdminHeader from '../components/AdminHeader'

interface User {
  email: string
  name: string
  plan: string
  blocked: boolean
  signedUpAt: string
  lastActiveAt: string
  picture?: string
}

export default function AdminAccounts() {
  useAdminAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)

  useEffect(() => { 
    fetchUsers() 
    const interval = setInterval(fetchUsers, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setRefreshing(true)
    setErrorInfo(null)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP_${res.status}`)
      const data = await res.json()
      
      const userList = data.users || (Array.isArray(data) ? data : [])
      setUsers(userList)
      setFiltered(userList)
      
      if (userList.length === 0) {
        setErrorInfo("DATABASE_EMPTY: No registered nodes found in registry.")
      }
    } catch (e: any) { 
      setErrorInfo(`FETCH_ERROR: ${e.message}`)
    } finally { 
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function forceRegisterMe() {
    const email = localStorage.getItem('helix_user_email')
    const name = localStorage.getItem('helix_user_name') || 'Admin'
    if (!email) {
      alert("ERROR: No active session found in localStorage.")
      return
    }
    
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      })
      if (res.ok) {
        alert("SUCCESS: Session registered in database.")
        fetchUsers()
      } else {
        const d = await res.json()
        alert(`FAILED: ${d.error || 'Server rejected registration'}`)
      }
    } catch (e: any) {
      alert(`NETWORK_ERROR: ${e.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    const lower = q.toLowerCase()
    setFiltered(users.filter(u => u.email.toLowerCase().includes(lower) || u.name?.toLowerCase().includes(lower)))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <AdminHeader />

      <style>{`
        .user-card { background: #111; border: 1px solid #1a1a1a; border-radius: 16px; padding: 24px; position: relative; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Page Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, maxWidth: 1400, margin: '0 auto 40px' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Entity Registry</h2>
          <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>Monitoring {users.length} authenticated nodes</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={forceRegisterMe}
            style={{ background: '#1a1a1a', color: '#60a5fa', border: '1px solid #222', borderRadius: 10, padding: '0 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <UserPlus size={14} /> FORCE_REGISTER_ME
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#444' }} />
            <input 
              placeholder="Filter registry..." 
              value={searchQuery} onChange={e => handleSearch(e.target.value)}
              style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '10px 12px 10px 36px', color: '#fff', fontSize: 13, width: 200, outline: 'none' }}
            />
          </div>
          <button 
            onClick={fetchUsers} 
            disabled={refreshing}
            style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '0 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'SYNCING...' : 'SYNC_REGISTRY'}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {errorInfo && (
          <div style={{ background: '#1a1111', border: '1px solid #451a1a', borderRadius: 12, padding: 20, marginBottom: 30, display: 'flex', alignItems: 'center', gap: 16 }}>
             <AlertTriangle color="#f87171" size={20} />
             <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600, fontFamily: 'monospace' }}>{errorInfo}</div>
          </div>
        )}

        {loading && !refreshing ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#444' }}>RETRIEVING_DATA...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', border: '1px dashed #1a1a1a', borderRadius: 20 }}>
            <div style={{ fontSize: 14, color: '#444', marginBottom: 12 }}>NO_NODES_IN_REGISTRY</div>
            <p style={{ color: '#333', fontSize: 12, maxWidth: 300, margin: '0 auto' }}>
              Ensure your account is registered. Try clicking "FORCE_REGISTER_ME" if you are currently logged in.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
            {filtered.map(user => (
              <div key={user.email} className="user-card">
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  {user.picture ? (
                    <img src={user.picture} style={{ width: 52, height: 52, borderRadius: 14, border: '1px solid #222' }} alt="" />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#60a5fa', border: '1px solid #222' }}>
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{user.name || 'Anonymous Entity'}</div>
                    <div style={{ fontSize: 12, color: '#60a5fa', marginTop: 2 }}>{user.email}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 10, color: '#444', fontWeight: 800 }}>LAST_SEEN</div>
                      {user.lastActiveAt && (new Date().getTime() - new Date(user.lastActiveAt).getTime() < 3600000) && (
                        <div style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 8px #4ade80' }} />
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#ccc' }}>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 10, color: '#444', fontWeight: 800 }}>TIER_CONTROL</div>
                      <select 
                        value={user.plan || 'pro'}
                        onChange={async (e) => {
                          const newPlan = e.target.value
                          setRefreshing(true)
                          await fetch('/api/admin/update-plan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: user.email, plan: newPlan })
                          })
                          fetchUsers()
                        }}
                        style={{ background: '#1a1a1a', color: user.plan === 'ultra' ? '#fbbf24' : user.plan === 'proplus' ? '#a78bfa' : '#60a5fa', border: 'none', fontSize: 10, fontWeight: 800, borderRadius: 4, padding: '2px 4px', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="pro">PRO</option>
                        <option value="proplus">PRO+</option>
                        <option value="ultra">ULTRA</option>
                      </select>
                    </div>
                    <div style={{ fontSize: 11, color: '#ccc' }}>{user.signedUpAt ? new Date(user.signedUpAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
