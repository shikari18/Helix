'use client'

import { useState, useRef } from 'react'
import type { Message } from '../types'
import { parseCodeBlocks, renderMarkdown } from '../lib/markdown'
import CodeBlock from './CodeBlock'

interface Props {
  message: Message
  isTyping?: boolean
  onRegenerate?: () => void
  chatMode?: 'chat' | 'agent'
}

export default function MessageBubble({ message, isTyping, onRegenerate, chatMode }: Props) {
  const { role, content, images } = message
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const copyContent = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (role === 'user') {
    // ... (rest of user message logic stays same)
    return (
      <div
        style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {images && images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {images.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', border: '1px solid #3d3d3d' }} />
            ))}
          </div>
        )}
        {content && (
          <div style={{
            background: '#2d2d2d',
            padding: '10px 16px',
            borderRadius: 16,
            border: '1px solid #3d3d3d',
            maxWidth: '85%',
            fontSize: 16,
            lineHeight: 1.5,
            color: '#fff',
          }}>
            {content}
          </div>
        )}
        {/* ... */}
      </div>
    )
  }

  // Assistant message
  let displayContent = content
  let thought = ''
  
  // Hide Agent Action JSON from the UI
  if (content.includes('"agent_action": true')) {
      displayContent = content.replace(/\{[\s\S]*"agent_action"\s*:\s*true[\s\S]*\}/g, '').trim()
  }

  // Parse Thought Tags
  const thoughtMatch = displayContent.match(/<thought>([\s\S]*?)<\/thought>/)
  if (thoughtMatch) {
      thought = thoughtMatch[1].trim()
      displayContent = displayContent.replace(/<thought>[\s\S]*?<\/thought>/, '').trim()
  }

  const parts = parseCodeBlocks(displayContent)

  const BrainIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96.44 2.5 2.5 0 0 0-2.79-3.56 2.5 2.5 0 0 0 .5 4.78 2.5 2.5 0 0 0 .75 4.1 2.5 2.5 0 0 0 4 2.5V4.5Z"/>
      <path d="M12 4.5a2.5 2.5 0 0 1 4.96.44 2.5 2.5 0 0 1 2.79.31 2.5 2.5 0 0 1-.25 4.78 2.5 2.5 0 0 1-.75 4.1 2.5 2.5 0 0 1-4 2.5V4.5Z"/>
    </svg>
  )

  return (
    <div
      style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Persistent Reasoning Block — Only in Agent Mode */}
      {thought && (chatMode === 'agent' || content.includes('"agent_action": true')) && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    color: '#aaa',
                    fontSize: 14,
                    fontWeight: 500,
                    userSelect: 'none',
                    width: 'fit-content'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BrainIcon />
                    <span>Reasoning</span>
                </div>
            </div>
            
            <div style={{ 
                padding: '12px 16px', 
                background: 'rgba(255,255,255,0.03)', 
                borderLeft: '2px solid rgba(255,255,255,0.1)',
                color: '#888',
                fontSize: 15,
                lineHeight: '1.6',
                fontStyle: 'italic',
                borderRadius: '0 8px 8px 0'
            }}>
                {thought}
            </div>
          </div>
      )}

      <div ref={contentRef} style={{ fontSize: 20, lineHeight: 1.75, color: '#fff' }}>
        {parts.map((part, i) => {
          if (part.type === 'code') {
            return <CodeBlock key={i} language={part.language || ''} content={part.content} />
          }
          return (
            <div
              key={i}
              className="md-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }}
            />
          )
        })}
      </div>

      {/* Actions — only show when done typing */}
      {!isTyping && (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={copyContent}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? '#4ade80' : '#666', padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseOver={e => { if (!copied) (e.currentTarget.style.color = '#fff') }}
          onMouseOut={e => { if (!copied) (e.currentTarget.style.color = '#666') }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#666', padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = '#fff')}
            onMouseOut={e => (e.currentTarget.style.color = '#666')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
            </svg>
          </button>
        )}

        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#666', padding: 6, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#fff')}
          onMouseOut={e => (e.currentTarget.style.color = '#666')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </div>
      )}
    </div>
  )
}
