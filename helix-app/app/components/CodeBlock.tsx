'use client'

import { useState } from 'react'

interface Props {
  language: string
  content: string
}

export default function CodeBlock({ language, content }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = language || 'txt'
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `code.${ext}`
    a.click()
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        {language && (
          <span style={{
            fontSize: 12, color: '#555', fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            letterSpacing: '0.04em', marginRight: 'auto', userSelect: 'none',
          }}>
            {language}
          </span>
        )}
        <button className="code-copy-btn" onClick={handleDownload} title="Download">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button className="code-copy-btn" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'}>
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>
      <div className="code-block-content">{content}</div>
    </div>
  )
}
