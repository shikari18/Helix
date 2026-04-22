'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'

interface AdminHeaderProps {
  title: string
  onSearch?: (q: string) => void
  userPicture?: string
}

export function AdminHeader({ title, onSearch, userPicture }: AdminHeaderProps) {
  const [q, setQ] = useState('')
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px', borderBottom: '1px solid #1f1f1f', background: '#0a0a0a'
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: '#f3f4f6', margin: 0 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8,
          padding: '8px 14px', color: '#6b7280', minWidth: 240
        }}>
          <Search size={16} />
          <input
            type="text" placeholder="Search users..." value={q}
            onChange={e => { setQ(e.target.value); onSearch?.(e.target.value) }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e5e7eb', fontSize: 13, width: '100%' }}
          />
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#1a3a6b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#60a5fa', fontWeight: 700, fontSize: 14, overflow: 'hidden'
        }}>
          {userPicture ? <img src={userPicture} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'S'}
        </div>
      </div>
    </header>
  )
}
