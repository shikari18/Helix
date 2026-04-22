'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (username === 'shikari' && password === 'shikari1234') {
        sessionStorage.setItem('helix_admin_auth', 'true')
        router.push('/admin')
      } else {
        setError('Invalid username or password')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, background: '#1a3a6b', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 22, fontWeight: 800, color: '#60a5fa'
          }}>H</div>
          <h1 style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, margin: 0 }}>Helix Admin</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>Sign in to access the control panel</p>
        </div>

        <form onSubmit={handleLogin} style={{
          background: '#111', border: '1px solid #1f1f1f', borderRadius: 14, padding: 32
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="Enter username"
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
                borderRadius: 8, padding: '11px 14px', color: '#e5e7eb', fontSize: 14,
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Enter password"
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
                borderRadius: 8, padding: '11px 14px', color: '#e5e7eb', fontSize: 14,
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', background: loading ? '#1e3a6b' : '#2563eb', border: 'none',
            borderRadius: 8, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
