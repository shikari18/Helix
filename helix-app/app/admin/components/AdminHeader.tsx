'use client'
import { Bell, Search } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface AdminHeaderProps {
  title?: string
  onSearch?: (query: string) => void
}

export default function AdminHeader({ title, onSearch }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    sessionStorage.removeItem('helix_admin_auth')
    router.push('/admin/login')
  }

  const navItems = [
    { label: 'Overview', path: '/admin' },
    { label: 'Accounts', path: '/admin/accounts' },
    { label: 'Audit Logs', path: '/admin/activity' },
    { label: 'Messaging', path: '/admin/messaging' },
    { label: 'Plans', path: '/admin/plans' }
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto 60px' }}>
      <style>{`
        .nav-item {
          padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;
          color: #666; cursor: pointer; transition: all 0.2s;
        }
        .nav-item.active { background: #1a1a1a; color: #fff; }
        .nav-item:hover { color: #888; }
        .nav-item.active:hover { color: #fff; }
      `}</style>

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{title || 'HELIX_ADMIN_CORE'}</h1>
          <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>v1.0.4 // SESSION_ACTIVE</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
             <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: '#444' }} />
             <input 
              placeholder="Search functions..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                onSearch?.(e.target.value)
              }}
              style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '10px 14px 10px 40px', color: '#fff', fontSize: 14, outline: 'none', width: 240 }}
             />
          </div>
          <button style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
            <Bell size={16} />
          </button>
          <button onClick={handleLogout} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            LOGOUT
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        {navItems.map((item) => (
          <div 
            key={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
