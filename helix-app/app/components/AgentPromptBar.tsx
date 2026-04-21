'use client'

import { useState } from 'react'

interface Props {
  actionType: string
  originalMessage: string
  running: boolean
  onExecute: () => void
  onExplain: () => void
  onDismiss: () => void
}

export default function AgentPromptBar({ running, onExecute, onExplain, onDismiss }: Props) {
  const [selected, setSelected] = useState<'execute' | 'explain' | null>(null)

  const handleSubmit = () => {
    if (!selected) return
    if (selected === 'execute') onExecute()
    else onExplain()
  }

  return (
    <div style={{
      background: '#111',
      border: '1px solid #222',
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { key: 'execute' as const, label: 'Do it for me' },
          { key: 'explain' as const, label: 'Explain it' },
        ].map(opt => (
          <div
            key={opt.key}
            onClick={() => !running && setSelected(opt.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: running ? 'not-allowed' : 'pointer',
              padding: '6px 4px',
              borderRadius: 8,
              transition: 'background 0.1s',
            }}
            onMouseOver={e => { if (!running) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {/* Radio circle */}
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: `1.5px solid ${selected === opt.key ? '#fff' : '#444'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'border-color 0.15s',
            }}>
              {selected === opt.key && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              )}
            </div>
            <span style={{
              fontSize: 14, color: selected === opt.key ? '#fff' : '#888',
              transition: 'color 0.15s', userSelect: 'none',
            }}>
              {opt.label}
            </span>
          </div>
        ))}
      </div>

      {/* Submit row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={!selected || running}
          style={{
            padding: '7px 20px', borderRadius: 20,
            border: 'none',
            background: selected && !running ? '#fff' : '#222',
            color: selected && !running ? '#111' : '#444',
            fontSize: 13, fontWeight: 600,
            cursor: selected && !running ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          {running ? 'Running...' : 'Submit'}
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', color: '#444',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#888' }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#444' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
