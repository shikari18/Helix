'use client'

import { useState, useEffect, useRef } from 'react'
import type { ChatItem } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  chatList: ChatItem[]
  onSelectChat: (id: string) => void
}

function getRelativeLabel(ts: number | undefined): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return 'Past week'
  if (days < 30) return 'Past month'
  return 'Older'
}

export default function SearchOverlay({ isOpen, onClose, chatList, onSelectChat }: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? chatList.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
    : chatList.slice(0, 40)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [isOpen])

  useEffect(() => { setActiveIdx(0) }, [query])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const pick = (id: string) => { onSelectChat(id); onClose() }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && filtered[activeIdx]) pick(filtered[activeIdx].id)
    else if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @keyframes hxSearchIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .hx-sr-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          transition: background 0.1s;
        }
        .hx-sr-item:hover { background: #232323; }
        .hx-sr-item.hx-active { background: #2a2a2a; }
        .hx-sr-title {
          flex: 1;
          font-size: 13.5px;
          color: #d4d4d4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 400;
        }
        .hx-sr-time {
          font-size: 11px;
          color: #3d3d3d;
          flex-shrink: 0;
          letter-spacing: 0.1px;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 901,
          width: 560,
          maxWidth: 'calc(100vw - 32px)',
          background: '#161616',
          border: '1px solid #262626',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
          animation: 'hxSearchIn 0.16s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          borderBottom: '1px solid #1e1e1e',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search chats and projects"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#e8e8e8', fontSize: 14, fontFamily: 'inherit',
              letterSpacing: '-0.1px',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: '#252525', border: 'none', borderRadius: 5, cursor: 'pointer', color: '#555', padding: '2px 7px', fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}
            >
              clear
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 5, cursor: 'pointer', color: '#404040', padding: '2px 8px', fontSize: 11, fontFamily: 'inherit', letterSpacing: '0.2px', flexShrink: 0 }}
          >
            esc
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{ maxHeight: 380, overflowY: 'auto', padding: '6px 8px 8px', scrollbarWidth: 'thin', scrollbarColor: '#262626 transparent' }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: '#333', fontSize: 13 }}>
              No chats match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((chat, i) => (
              <div
                key={chat.id}
                className={`hx-sr-item${i === activeIdx ? ' hx-active' : ''}`}
                onClick={() => pick(chat.id)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#383838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="hx-sr-title">{chat.title}</span>
                <span className="hx-sr-time">{getRelativeLabel(chat.timestamp)}</span>
              </div>
            ))
          )}
        </div>

        {/* Subtle footer */}
        <div style={{
          borderTop: '1px solid #1a1a1a',
          padding: '7px 14px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([k, l]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: '#383838', fontFamily: 'monospace' }}>{k}</kbd>
              <span style={{ fontSize: 10, color: '#2e2e2e' }}>{l}</span>
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#272727' }}>{filtered.length} chat{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  )
}
