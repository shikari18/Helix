'use client'

import { useState } from 'react'
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
  onStartGroupChat?: () => void
}

export default function Sidebar({ open, onClose, chatList, setChatList, currentChatId, onNewChat, onSelectChat, onLogout, onShareChat, onLearnHacking, onStartGroupChat }: Props) {
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
  
  const getPlanName = () => {
    if (typeof window === 'undefined') return 'Free plan'
    const plan = localStorage.getItem('helix_plan') || 'free'
    if (plan === 'ultra') return 'Ultra'
    if (plan === 'proplus') return 'Pro+'
    if (plan === 'pro') return 'Pro'
    return 'Free plan'
  }

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
        background: '#1a1a1a', borderRight: '1px solid #2d2d2d',
        borderRadius: '0 20px 0 20px',
        transition: 'left 0.3s ease', zIndex: 200,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d2d2d' }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Helix</span>
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

        {/* Group Chat */}
        <button
          onClick={() => {
            if (groupChats.length >= 4) {
              alert("You can only have up to 4 group chats. Please delete an existing one to create or join another.")
              return
            }
            onStartGroupChat?.()
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
          Group Chat
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

        {/* Group Chats Section */}
        {groupChats.length > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px 8px', marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GROUP CHATS</span>
              <button
                onClick={() => setShowClearGroupsConfirm(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#666', fontFamily: 'inherit', transition: 'color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#b0b0b0')}
                onMouseOut={e => (e.currentTarget.style.color = '#666')}
              >
                Clear All
              </button>
            </div>
            <div style={{ padding: '0 16px' }}>
              {groupChats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
            </div>
          </>
        )}

        {/* Recent Chats Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '16px 28px 8px', 
          marginTop: 8,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RECENT CHATS</span>
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: 12, 
              color: '#666', 
              fontFamily: 'inherit',
              transition: 'color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#b0b0b0')}
            onMouseOut={e => (e.currentTarget.style.color = '#666')}
          >
            Clear All
          </button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {regularChats.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#505050' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span style={{ fontSize: 13 }}>No chats yet</span>
            </div>
          ) : (
            regularChats.map(chat => <ChatItem key={chat.id} chat={chat} />)
          )}
        </div>

        {/* Clear All Confirmation Dialog */}
        {showClearConfirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#1a1a1a', border: '1px solid #2d2d2d',
              borderRadius: 16, padding: 28, width: 320,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Clear All Chats</h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
                Are you sure you want to clear all chat history? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    border: '1px solid #3d3d3d', background: '#2d2d2d',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#3d3d3d')}
                  onMouseOut={e => (e.currentTarget.style.background = '#2d2d2d')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    border: 'none', background: '#e53935',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#c62828')}
                  onMouseOut={e => (e.currentTarget.style.background = '#e53935')}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Group Chats Confirmation Dialog */}
        {showClearGroupsConfirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#1a1a1a', border: '1px solid #2d2d2d',
              borderRadius: 16, padding: 28, width: 320,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Clear All Group Chats</h3>
              <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
                Are you sure you want to clear all group chats?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowClearGroupsConfirm(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    border: '1px solid #3d3d3d', background: '#2d2d2d',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#3d3d3d')}
                  onMouseOut={e => (e.currentTarget.style.background = '#2d2d2d')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllGroups}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    border: 'none', background: '#e53935',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#c62828')}
                  onMouseOut={e => (e.currentTarget.style.background = '#e53935')}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #2d2d2d', padding: 12, position: 'relative' }}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
            onMouseOver={e => (e.currentTarget.style.background = '#2d2d2d')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 18, background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
              {userPicture ? <img src={userPicture} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{userName}</div>
              <div style={{ fontSize: 12, color: '#808080' }}>{userEmail || getPlanName()}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              {/* Close on outside click */}
              <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                background: '#2d2d2d',
                border: '1px solid #3d3d3d',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                zIndex: 300,
                overflow: 'hidden',
                marginBottom: 8,
              }}>
              <div 
                onClick={() => { setDropdownOpen(false); /* Open settings */ }}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.background = '#3d3d3d')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"/>
                </svg>
                Settings
              </div>
              {!isMobile && (
                <div 
                  onClick={() => { setDropdownOpen(false); window.open('/download', '_blank'); }}
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#3d3d3d')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  Download Helix on your PC
                </div>
              )}
              <div 
                onClick={() => { setDropdownOpen(false); window.open('https://helix.com/learn', '_blank'); }}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.background = '#3d3d3d')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Learn more
              </div>
              <div style={{ height: 1, background: '#3d3d3d', margin: '4px 0' }} />
              <div 
                onClick={() => { 
                  setDropdownOpen(false)
                  onLogout()
                }}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.background = '#3d3d3d')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
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
