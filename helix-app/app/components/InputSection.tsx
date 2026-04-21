'use client'

import { useRef, useState, useEffect } from 'react'
import type { ChatMode } from '../types'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: (text: string, images?: string[]) => void
  chatMode: ChatMode
  onChatModeChange: (m: ChatMode) => void
  isGhostMode: boolean
  chatActive?: boolean
  isTyping?: boolean
  onStop?: () => void
  disabled?: boolean
  rateLimited?: boolean
  agentPrompt?: { actionType: string } | null
  agentRunning?: boolean
  onAgentExecute?: () => void
  onAgentExplain?: () => void
  onAgentDismiss?: () => void
}

export default function InputSection({ value, onChange, onSend, chatMode, onChatModeChange, isGhostMode, chatActive = false, isTyping = false, onStop, disabled = false, rateLimited = false, agentPrompt = null, agentRunning = false, onAgentExecute, onAgentExplain, onAgentDismiss }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDictating, setIsDictating] = useState(false)
  const [agentChoice, setAgentChoice] = useState<'execute' | 'explain' | null>(null)
  const dictCanvasRef = useRef<HTMLCanvasElement>(null)
  const ghostCanvasRef = useRef<HTMLCanvasElement>(null)
  const dictRAFRef = useRef<number | null>(null)
  const ghostRAFRef = useRef<number | null>(null)
  const dictAngleRef = useRef(0)
  const ghostAngleRef = useRef(0)

  const handleSend = () => {
    if (!(value || '').trim() && uploadedImages.length === 0) return
    onSend(value || '', uploadedImages)
    onChange('')
    setUploadedImages([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = evt => {
          if (evt.target?.result) {
            setUploadedImages(prev => [...prev, evt.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [showAgentUpgradePopup, setShowAgentUpgradePopup] = useState(false)

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowUpgradePopup(!showUpgradePopup)
  }

  const handleModeChange = (mode: ChatMode) => {
    onChatModeChange(mode)
    setModeDropdownOpen(false)
  }

  // Dictation border animation
  const startDictBorder = () => {
    const canvas = dictCanvasRef.current
    if (!canvas) return
    
    const container = canvas.parentElement
    if (!container) return
    
    canvas.width = container.offsetWidth + 4
    canvas.height = container.offsetHeight + 4
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const W = canvas.width, H = canvas.height
    const R = 30

    const drawRoundedPath = () => {
      ctx.beginPath()
      ctx.moveTo(R, 0)
      ctx.lineTo(W - R, 0)
      ctx.arcTo(W, 0, W, R, R)
      ctx.lineTo(W, H - R)
      ctx.arcTo(W, H, W - R, H, R)
      ctx.lineTo(R, H)
      ctx.arcTo(0, H, 0, H - R, R)
      ctx.lineTo(0, R)
      ctx.arcTo(0, 0, R, 0, R)
      ctx.closePath()
    }

    const perimeter = 2 * (W + H) - 8 * R + 2 * Math.PI * R

    const angleToPoint = (t: number) => {
      const p = t * perimeter
      const top = W - 2 * R + Math.PI * R / 2
      const right = top + H - 2 * R + Math.PI * R / 2
      const bottom = right + W - 2 * R + Math.PI * R / 2

      if (p < top) return { x: R + p, y: 0 }
      if (p < right) { const d = p - top; return { x: W, y: R + d } }
      if (p < bottom) { const d = p - right; return { x: W - R - d, y: H } }
      return { x: 0, y: H - R - (p - bottom) }
    }

    const draw = () => {
      dictRAFRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, W, H)

      // Dim base border
      ctx.save()
      drawRoundedPath()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Moving light
      dictAngleRef.current = (dictAngleRef.current + 0.004) % 1
      const pt = angleToPoint(dictAngleRef.current)
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 140)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.15, 'rgba(255,255,255,0.7)')
      grad.addColorStop(0.4, 'rgba(255,255,255,0.2)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')

      ctx.save()
      drawRoundedPath()
      ctx.strokeStyle = grad
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.restore()
    }
    draw()
  }

  const stopDictBorder = () => {
    if (dictRAFRef.current) {
      cancelAnimationFrame(dictRAFRef.current)
      dictRAFRef.current = null
    }
    const canvas = dictCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Ghost border animation
  const startGhostBorder = () => {
    const canvas = ghostCanvasRef.current
    if (!canvas) return
    
    const container = canvas.parentElement
    if (!container) return
    
    canvas.width = container.offsetWidth + 4
    canvas.height = container.offsetHeight + 4
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const W = canvas.width, H = canvas.height
    const R = 30

    const drawPath = () => {
      ctx.beginPath()
      ctx.moveTo(R, 0)
      ctx.lineTo(W - R, 0)
      ctx.arcTo(W, 0, W, R, R)
      ctx.lineTo(W, H - R)
      ctx.arcTo(W, H, W - R, H, R)
      ctx.lineTo(R, H)
      ctx.arcTo(0, H, 0, H - R, R)
      ctx.lineTo(0, R)
      ctx.arcTo(0, 0, R, 0, R)
      ctx.closePath()
    }

    const perimeter = 2 * (W - 2*R) + 2 * (H - 2*R) + 2 * Math.PI * R

    const ptAt = (t: number) => {
      const p = ((t % 1) + 1) % 1 * perimeter
      const top = W - 2*R, right = top + H - 2*R, bottom = right + W - 2*R
      if (p <= top) return { x: R + p, y: 0 }
      if (p <= right) return { x: W, y: R + (p - top) }
      if (p <= bottom) return { x: W - R - (p - right), y: H }
      return { x: 0, y: H - R - (p - bottom) }
    }

    const draw = () => {
      ghostRAFRef.current = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, W, H)

      // Dim base border
      ctx.save()
      drawPath()
      ctx.strokeStyle = 'rgba(120,80,200,0.2)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Moving light
      ghostAngleRef.current = (ghostAngleRef.current + 0.0025) % 1
      const pt = ptAt(ghostAngleRef.current)
      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 150)
      g.addColorStop(0, 'rgba(180,120,255,1)')
      g.addColorStop(0.2, 'rgba(150,90,240,0.6)')
      g.addColorStop(0.5, 'rgba(120,60,200,0.2)')
      g.addColorStop(1, 'rgba(100,50,180,0)')

      ctx.save()
      drawPath()
      ctx.strokeStyle = g
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.restore()
    }
    draw()
  }

  const stopGhostBorder = () => {
    if (ghostRAFRef.current) {
      cancelAnimationFrame(ghostRAFRef.current)
      ghostRAFRef.current = null
    }
    const canvas = ghostCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const recognitionRef = useRef<any>(null)

  const handleDictationClick = () => {
    if (isDictating) {
      // Stop dictation
      setIsDictating(false)
      stopDictBorder()
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    } else {
      // Start dictation using Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Voice dictation is not supported in this browser.')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        onChange(transcript)
      }

      recognition.onerror = () => {
        setIsDictating(false)
        stopDictBorder()
        recognitionRef.current = null
      }

      recognition.onend = () => {
        setIsDictating(false)
        stopDictBorder()
        recognitionRef.current = null
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsDictating(true)
      startDictBorder()
    }
  }

  // Start/stop ghost border when ghost mode changes
  useEffect(() => {
    if (isGhostMode) {
      startGhostBorder()
    } else {
      stopGhostBorder()
    }
    return () => {
      stopGhostBorder()
    }
  }, [isGhostMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDictBorder()
      stopGhostBorder()
    }
  }, [])

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showUpgradePopup) {
        if (!target.closest('.upgrade-attach-popup') && !target.closest('.icon-btn')) {
          setShowUpgradePopup(false)
        }
      }
      if (showAgentUpgradePopup) {
        if (!target.closest('.upgrade-attach-popup') && !target.closest('.mode-pill-wrap')) {
          setShowAgentUpgradePopup(false)
        }
      }
      if (modeDropdownOpen) {
        if (!target.closest('.mode-pill-wrap')) {
          setModeDropdownOpen(false)
        }
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showUpgradePopup, showAgentUpgradePopup, modeDropdownOpen])

  const hasContent = (value || '').trim().length > 0 || uploadedImages.length > 0

  return (
    <div className="input-section">
      <div className={`input-container ${isGhostMode ? 'ghost-mode' : ''} ${isDictating ? 'dictating' : ''}`}>
        {/* Canvas for dictation border animation */}
        <canvas ref={dictCanvasRef} id="dictBorderCanvas"></canvas>
        {/* Canvas for ghost mode border animation */}
        <canvas ref={ghostCanvasRef} id="ghostBorderCanvas"></canvas>
        
        {/* Image previews */}
        {uploadedImages.length > 0 && (
          <div className="image-preview-container active">
            {uploadedImages.map((src, i) => (
              <div key={i} className="image-preview">
                <img src={src} alt="" />
                <button
                  onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                  className="remove-image"
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea or Agent choice */}
        <div className="input-wrapper">
          <div className="textarea-wrapper">
            {agentPrompt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                {[
                  { key: 'execute' as const, label: 'Do it for me' },
                  { key: 'explain' as const, label: 'Explain it' },
                ].map(opt => (
                  <div
                    key={opt.key}
                    onClick={() => !agentRunning && setAgentChoice(opt.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: agentRunning ? 'not-allowed' : 'pointer', padding: '2px 0' }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${agentChoice === opt.key ? '#fff' : '#444'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.15s',
                    }}>
                      {agentChoice === opt.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: 15, color: agentChoice === opt.key ? '#fff' : '#888', transition: 'color 0.15s', userSelect: 'none' }}>
                      {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={isGhostMode ? 'Ghost Mode — no traces...' : (chatActive ? 'Reply Helix...' : 'Ask, recon, or hack something')}
                id="messageInput"
                spellCheck={false}
              />
            )}
          </div>

          {/* Footer */}
          <div className="input-footer">
            {/* Left actions */}
            <div className="input-actions">
              {/* Upload */}
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
              <button
                onClick={handleUploadClick}
                className="icon-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Mode pill */}
              <div className="mode-pill-wrap">
                <button
                  onClick={() => {
                    if (chatMode !== 'agent') {
                      setShowAgentUpgradePopup(o => !o)
                      setModeDropdownOpen(false)
                    } else {
                      setModeDropdownOpen(o => !o)
                      setShowAgentUpgradePopup(false)
                    }
                  }}
                  className={`mode-pill ${chatMode === 'agent' ? 'agent-active' : ''}`}
                >
                  {chatMode === 'agent' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="6" y1="8" x2="6" y2="8.01"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="6" y2="11.01"/><line x1="10" y1="11" x2="14" y2="11"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  )}
                  {chatMode === 'chat' ? 'Chat' : 'Agent'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {modeDropdownOpen && (
                  <div className="mode-dropdown active">
                    {[
                      { mode: 'chat' as ChatMode, label: 'Chat', desc: 'Ask your hacking questions', icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
                      { mode: 'agent' as ChatMode, label: 'Agent', desc: 'Hack, test, secure anything', icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="6" y1="8" x2="6" y2="8.01"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="6" y2="11.01"/><line x1="10" y1="11" x2="14" y2="11"/></> },
                    ].map(opt => (
                      <div
                        key={opt.mode}
                        onClick={() => handleModeChange(opt.mode)}
                        className="mode-option"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{opt.icon}</svg>
                        <div>
                          <div className="mode-option-title">{opt.label}</div>
                          <div className="mode-option-desc">{opt.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div className="right-actions">
              {/* Mic button */}
              <button
                className={`icon-btn ${isDictating ? 'active' : ''}`}
                onClick={handleDictationClick}
                title="Voice Dictation"
              >
                {!isDictating ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                  </svg>
                )}
              </button>

              {/* Send / Stop button */}
              <button
                onClick={agentPrompt
                  ? () => { if (agentChoice === 'execute') { onAgentExecute?.(); setAgentChoice(null) } else if (agentChoice === 'explain') { onAgentExplain?.(); setAgentChoice(null) } }
                  : isTyping ? onStop : handleSend}
                className={agentPrompt
                  ? `send-btn ${agentChoice ? 'send-mode' : 'voice-mode'}`
                  : isTyping ? 'send-btn stop-mode' : `send-btn ${hasContent ? 'send-mode' : 'voice-mode'}`}
                title={agentPrompt ? 'Submit' : isTyping ? 'Stop' : 'Send'}
                disabled={agentPrompt ? !agentChoice || agentRunning : false}
              >
                {isTyping ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                  </svg>
                ) : (
                  <svg className="icon-send" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Attach Popup */}
      {showUpgradePopup && (
        <div className="upgrade-attach-popup active">
          <h3>Upgrade plan</h3>
          <p>Get access to file attachments and more features with Pro</p>
          <a href="/pricing" className="upgrade-attach-btn">Upgrade now</a>
        </div>
      )}

      {/* Agent Mode Upgrade Popup */}
      {showAgentUpgradePopup && (
        <div className="upgrade-attach-popup active" style={{ left: 60 }}>
          <h3>Upgrade to Agent Mode</h3>
          <p>Agent Mode lets HELIX autonomously run scans, recon, and multi-step hacking workflows in real time.</p>
          <a href="/pricing" className="upgrade-attach-btn">Upgrade now</a>
        </div>
      )}

    </div>
  )
}
