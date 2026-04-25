'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ChatItem } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  chatList: ChatItem[]
  setChatList: React.Dispatch<React.SetStateAction<ChatItem[]>>
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onLogout: () => void
  onShareChat: () => void
  onLearnHacking?: () => void
  onOpenGroupMenu?: () => void
  isMobile?: boolean
  plan?: string
}

export default function Sidebar({ open, onClose, chatList, setChatList, currentChatId, onNewChat, onSelectChat, onLogout, onShareChat, onLearnHacking, onOpenGroupMenu, isMobile = false, plan = 'free' }: Props) {
  const getPlanName = () => {
    if (plan === 'ultra') return 'Ultra'
    if (plan === 'proplus') return 'Pro+'
    if (plan === 'pro') return 'Pro'
    return 'Free'
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showClearGroupsConfirm, setShowClearGroupsConfirm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const userName = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_name') || 'User') : 'User'
  const userEmail = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_email') || '') : ''
  const userPicture = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_picture') || '') : ''
  const userInitial = userName.charAt(0).toUpperCase()
  
  const filtered = chatList.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  
  // Separate group chats from regular chats
  const groupChats = filtered.filter(c => c.isGroup === true)
  const regularChats = filtered.filter(c => !c.isGroup)

  const renameChat = (id: string, newTitle: string) => {
    setChatList(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c))
  }

  const deleteChat = (id: string) => {
    setChatList(prev => prev.filter(c => c.id !== id))
    setOpenMenuId(null)
  }

  const pinChat = (id: string) => {
    setChatList(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c))
    setOpenMenuId(null)
  }

  const ChatItem = ({ chat }: { chat: any }) => (
    <div
      style={{ position: 'relative' }}
      onMouseLeave={() => setOpenMenuId(null)}
    >
      {renamingId === chat.id ? (
        <input
          autoFocus
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onBlur={() => { renameChat(chat.id, renameValue || chat.title); setRenamingId(null) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { renameChat(chat.id, renameValue || chat.title); setRenamingId(null) }
            if (e.key === 'Escape') setRenamingId(null)
          }}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid #3d3d3d', background: '#2d2d2d',
            color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div
          onClick={() => onSelectChat(chat.id)}
          style={{
            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
            fontSize: 14, color: chat.id === currentChatId ? '#fff' : '#b0b0b0',
            background: chat.id === currentChatId ? '#2d2d2d' : 'transparent',
            marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { if (chat.id !== currentChatId) (e.currentTarget as HTMLElement).style.background = '#2d2d2d' }}
          onMouseOut={e => { if (chat.id !== currentChatId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 14, fontWeight: chat.id === currentChatId ? 600 : 400 }}>
            {chat.pinned && '📌 '}{chat.title}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === chat.id ? null : chat.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      )}

      {/* 3-dot dropdown */}
      {openMenuId === chat.id && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 500,
          background: '#1e1e1e', border: '1px solid #3d3d3d', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)', minWidth: 160, overflow: 'hidden',
        }}>
          {[
            { label: 'Rename', icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, action: () => { setRenameValue(chat.title); setRenamingId(chat.id); setOpenMenuId(null) } },
            { label: chat.pinned ? 'Unpin' : 'Pin', icon: chat.pinned ? <><line x1="2" y1="2" x2="22" y2="22"/><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7"/><rect x="9" y="3" width="6" height="4" rx="1"/></> : <><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7"/><rect x="9" y="3" width="6" height="4" rx="1"/></>, action: () => { pinChat(chat.id); setOpenMenuId(null) } },
            { label: 'Share', icon: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>, action: () => { onShareChat(); setOpenMenuId(null) } },
            { label: 'Delete', icon: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>, action: () => { deleteChat(chat.id); setOpenMenuId(null) }, red: true },
          ].map(item => (
            <div
              key={item.label}
              onClick={item.action}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: (item as any).red ? '#ff4444' : '#fff', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background = '#2d2d2d')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const handleClearAll = () => {
    setChatList(prev => prev.filter(c => c.isGroup))
    setShowClearConfirm(false)
  }

  const handleClearAllGroups = () => {
    setChatList(prev => prev.filter(c => !c.isGroup))
    setShowClearGroupsConfirm(false)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'transparent' }}
        />
      )}

      <div style={{
        position: 'fixed', top: 0, left: open ? 0 : -300,
        width: 300, height: '100vh',
        background: '#111', borderRight: '1px solid #222',
        transition: 'left 0.3s ease', zIndex: 200,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>Helix</span>
          <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{getPlanName()}</span>
        </div>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          style={{
            margin: '0 16px 8px', padding: '12px 16px', borderRadius: 12,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 14, fontWeight: 500, color: '#b0b0b0', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#b0b0b0' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M7 3 H13 M21 7 V17 Q21 21 17 21 H7 Q3 21 3 17 V7 Q3 3 7 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M8 15.5L15.5 8L16.5 9L9 16.5L7.5 17L8 15.5Z" fill="black" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Chat
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(o => !o)}
          style={{
            margin: '0 16px 8px', padding: '10px 14px', borderRadius: 10,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 14, fontWeight: 500, color: '#b0b0b0', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#b0b0b0' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Search
        </button>

        {searchOpen && (
          <div style={{ margin: '0 16px 8px', padding: '8px 12px', background: '#2d2d2d', borderRadius: 10 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>
        )}

        {/* Group Chat Section */}
        <button
          onClick={() => {
            onOpenGroupMenu?.()
            onClose()
          }}
          style={{
            margin: '0 16px 8px', padding: '10px 14px', borderRadius: 10,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 14, fontWeight: 500, color: '#b0b0b0', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#b0b0b0' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Group Chats
        </button>

        {/* Practice */}
        <button
          style={{
            margin: '0 16px 8px', padding: '10px 14px', borderRadius: 10,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 14, fontWeight: 500, color: '#b0b0b0', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#b0b0b0' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Practice
        </button>

        {/* Group Chats List */}
        {groupChats.length > 0 && (
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 6px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>GROUP CHATS</span>
              <button
                onClick={() => setShowClearGroupsConfirm(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#444', fontWeight: 600 }}
              >
                Clear
              </button>
            </div>
            {groupChats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
          </div>
        )}

        {/* Recent Chats Section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5 }}>RECENT CHATS</span>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#444', fontWeight: 600 }}
            >
              Clear
            </button>
          </div>
          {regularChats.length === 0 ? (
            <div style={{ padding: '40px 20px', color: '#333', fontSize: 12, textAlign: 'center' }}>No chats yet</div>
          ) : (
            regularChats.map(chat => <ChatItem key={chat.id} chat={chat} />)
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #222', padding: 12, position: 'relative' }}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.background = '#1a1a1a')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 32, height: 32, borderRadius: 6, background: '#222', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 12, flexShrink: 0 }}>
              {userPicture ? <img src={userPicture} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userName}</div>
              <div style={{ fontSize: 11, color: '#555', fontWeight: 500 }}>{getPlanName()} Account</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              {/* Close on outside click */}
              <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />
              <div style={
                isMobile
                  ? {
                      position: 'absolute',
                      bottom: '64px',
                      left: 0,
                      right: 0,
                      background: '#161616',
                      borderTop: '1px solid #222',
                      borderBottom: '1px solid #222',
                      zIndex: 300,
                      overflow: 'hidden',
                      animation: 'slideUp 0.15s ease-out',
                    }
                  : {
                      position: 'fixed',
                      bottom: '20px',
                      left: '300px',
                      width: '210px',
                      background: '#161616',
                      border: '1px solid #222',
                      borderLeft: 'none',
                      borderRadius: '0 12px 12px 0',
                      boxShadow: '10px 0 40px rgba(0,0,0,0.5)',
                      zIndex: 300,
                      overflow: 'hidden',
                      animation: 'slideIn 0.15s ease-out',
                    }
              }>
                <style>{`
                  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
                  @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                  .menu-item { padding: 12px 16px; cursor: pointer; font-size: 13px; color: #888; display: flex; align-items: center; gap: 10px; transition: all 0.15s; }
                  .menu-item:hover { background: #1a1a1a; color: #fff; }
                `}</style>

                <div className="menu-item" onClick={() => { setDropdownOpen(false); /* Open settings */ }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"/></svg>
                  Settings
                </div>

                {!isMobile && (
                  <div className="menu-item" onClick={() => { setDropdownOpen(false); window.open('/download', '_blank'); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    Download App
                  </div>
                )}

                <div className="menu-item" onClick={() => { setDropdownOpen(false); window.open('https://helix.com/learn', '_blank'); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Learn more
                </div>

                <div style={{ height: 1, background: '#222' }} />

                <div className="menu-item" style={{ color: '#ff4d4d' }} onClick={() => { setDropdownOpen(false); onLogout() }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Log out
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
