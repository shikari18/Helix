'use client'

import { useState } from 'react'

interface Props {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onNewChat: () => void
  onToggleGhost: () => void
  isGhostMode: boolean
  chatActive: boolean
  onShare?: () => void
  isGroupChat?: boolean
  groupChatName?: string
  onGroupChatNameChange?: (name: string) => void
  splitViewOpen?: boolean
}

export default function TopControls({ sidebarOpen, onToggleSidebar, onNewChat, onToggleGhost, isGhostMode, chatActive, onShare, isGroupChat = false, groupChatName = 'New group chat', onGroupChatNameChange, splitViewOpen = false }: Props) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(groupChatName)
  
  const handleNameSave = () => {
    if (editedName.trim() && onGroupChatNameChange) {
      onGroupChatNameChange(editedName.trim())
    }
    setIsEditingName(false)
  }
  
  return (
    <>
      {/* Left controls */}
      <div style={{
        position: 'fixed', top: 20, left: sidebarOpen ? 320 : 20,
        display: 'flex', gap: 12, alignItems: 'center',
        zIndex: 100, transition: 'left 0.3s ease',
      }}>
        {/* Minimalist Sidebar Toggle */}
        {!sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            style={{ 
              width: 36, height: 36,
              background: '#1a1a1a', 
              border: '1px solid #333', 
              cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'all 0.2s',
              borderRadius: '6px'
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#252525'; (e.currentTarget as HTMLElement).style.borderColor = '#444' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.borderColor = '#333' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        )}

        {/* New Chat — left side desktop, left side mobile only before chat */}
        {!sidebarOpen && !isGhostMode && !isGroupChat && (          <button
            onClick={onNewChat}
            id="topNewChatBtn"
            className={`new-chat-top-btn${chatActive ? ' mobile-hide' : ''}`}
            style={{
              padding: '10px 18px', borderRadius: 20,
              border: '1px solid #3d3d3d', background: '#1a1a1a',
              fontSize: 15, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 3 H13 M21 7 V17 Q21 21 17 21 H7 Q3 21 3 17 V7 Q3 3 7 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M8 15.5L15.5 8L16.5 9L9 16.5L7.5 17L8 15.5Z" fill="black" stroke="white" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Chat
          </button>
        )}
        
        {/* Group Chat Name — removed from top bar, shown in sidebar instead */}
      </div>

      {/* RIGHT side */}

      {/* Ghost button — only before chat starts */}
      {!isGhostMode && !chatActive && (
        <button
          onClick={onToggleGhost}
          title="Ghost Mode"
          style={{
            position: 'fixed', top: 20, right: 20,
            width: 40, height: 40,
            border: 'none', background: 'transparent',
            color: '#b0b0b0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.2s', zIndex: 9999,
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#b0b0b0' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3C8.13 3 5 6.13 5 10v8l2-2 2 2 2-2 2 2 2-2 2 2v-8c0-3.87-3.13-7-7-7z"/>
            <circle cx="9.5" cy="10.5" r="1" fill="currentColor"/>
            <circle cx="14.5" cy="10.5" r="1" fill="currentColor"/>
          </svg>
        </button>
      )}

      {/* Chat active — share + new chat on right */}
      {!isGhostMode && chatActive && !isGroupChat && (
        <div style={{
          position: 'fixed', top: 20, right: splitViewOpen ? 'calc(50% + 20px)' : 20,
          display: 'flex', alignItems: 'center', gap: 10,
          zIndex: 9999, transition: 'right 0.25s ease',
        }}>
          {/* Share button */}
          <button
            onClick={onShare}
            title="Share"
            style={{
              width: 40, height: 40, borderRadius: 8,
              border: '1px solid #3d3d3d', background: '#1a1a1a',
              color: '#b0b0b0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#b0b0b0' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>

          {/* New Chat — mobile only when chat active */}
          {!sidebarOpen && (
            <button
              onClick={onNewChat}
              className="new-chat-top-btn mobile-right-only"
              style={{
                padding: '10px 18px', borderRadius: 20,
                border: '1px solid #3d3d3d', background: '#1a1a1a',
                fontSize: 15, color: '#fff', cursor: 'pointer',
                display: 'none', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#2d2d2d' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M7 3 H13 M21 7 V17 Q21 21 17 21 H7 Q3 21 3 17 V7 Q3 3 7 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M8 15.5L15.5 8L16.5 9L9 16.5L7.5 17L8 15.5Z" fill="black" stroke="white" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              New Chat
            </button>
          )}
        </div>
      )}

      {/* Leave Ghost Mode */}
      {isGhostMode && (
        <button
          onClick={onToggleGhost}
          style={{
            position: 'fixed', top: 20, right: 20,
            padding: '8px 16px', borderRadius: 20,
            border: '1px solid #444', background: 'transparent',
            color: '#ccc', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.2s', fontFamily: 'inherit', zIndex: 9999,
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#fff'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#444'; (e.currentTarget as HTMLElement).style.color = '#ccc' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Leave Ghost Mode
        </button>
      )}
    </>
  )
}
