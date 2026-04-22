'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import GroupChatInterface from '../../components/GroupChatInterface'

export default function GroupChatPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params?.roomId as string
  const [valid, setValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!roomId || roomId.length < 8) {
      setValid(false)
      return
    }
    setValid(true)

    // Add this group chat to the user's sidebar (localStorage chatList)
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('helix_user_email') || 'guest'
      const safe = email.replace(/[^a-zA-Z0-9]/g, '_')
      const key = `helix_chat_list_${safe}`
      try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]')
        const alreadyExists = existing.find((c: any) => c.id === roomId)
        if (!alreadyExists) {
          const newEntry = {
            id: roomId,
            title: 'Group chat',
            pinned: false,
            timestamp: Date.now(),
            isGroup: true,
          }
          localStorage.setItem(key, JSON.stringify([newEntry, ...existing]))
        }
      } catch {}

      // Also persist group chat state so refresh stays here
      localStorage.setItem('helix_group_chat', 'true')
      localStorage.setItem('helix_group_room_id', roomId)
      localStorage.setItem('helix_group_name', 'Group chat')
    }
  }, [roomId])

  if (valid === null) return null

  if (!valid) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', background: '#141414', color: '#fff', gap: 16
      }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>Invalid invite link</h2>
        <p style={{ color: '#888', margin: 0 }}>This group chat link is invalid or has expired.</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 24px', background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, cursor: 'pointer' }}>
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: '#141414', minHeight: '100vh' }}>
      {/* Sidebar toggle — goes back to main app */}
      <button
        onClick={() => router.push('/')}
        title="Go to main app"
        style={{
          position: 'fixed', top: 20, left: 20, zIndex: 300,
          width: 40, height: 40, borderRadius: 8,
          border: '1px solid #3d3d3d', background: '#1a1a1a',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#b0b0b0', transition: 'all 0.2s',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
        </svg>
      </button>

      <GroupChatInterface roomId={roomId} onBack={() => router.push('/')} />
    </div>
  )
}
