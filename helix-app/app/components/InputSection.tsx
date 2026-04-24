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
  onStartGroupChat?: () => void
  isMobile?: boolean
  plan?: string
  onToast?: (msg: string, type?: 'info' | 'warn' | 'error') => void
}

export default function InputSection({ 
  value, 
  onChange, 
  onSend, 
  chatMode, 
  onChatModeChange, 
  isGhostMode, 
  chatActive = false, 
  isTyping = false, 
  onStop, 
  disabled = false, 
  rateLimited = false, 
  agentPrompt = null, 
  agentRunning = false, 
  onAgentExecute, 
  onAgentExplain, 
  onAgentDismiss, 
  onStartGroupChat,
  isMobile = false,
  plan = 'free',
  onToast
}: Props) {
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
    
    // Limits
    let max = 100 // ultra
    if (plan === 'free' || plan === 'pro') max = 2
    if (plan === 'proplus') max = 10

    if (uploadedImages.length + files.length > max) {
        alert(`You can only upload up to ${max} images per ${plan === 'proplus' ? 'week' : 'day'} on the ${plan} plan.`)
        return
    }

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

  const [showGetAgentPopup, setShowGetAgentPopup] = useState(false)
  const [showUpgradeProPopup, setShowUpgradeProPopup] = useState(false)

  const handleModeChange = (mode: ChatMode) => {
    if (mode === 'agent') {
      if (isMobile) {
        onToast?.("Agent Mode is a high-resource feature currently only available on the Helix Desktop App. Please switch to a PC to use it.", 'warn')
        setModeDropdownOpen(false)
        return
      }
      
      if (plan === 'free' || plan === 'pro') {
        setShowUpgradeProPopup(true)
        setModeDropdownOpen(false)
        return
      }

      // If already in desktop app, just switch mode
      const isActuallyDesktop = (window as any).helixDesktop?.isDesktop || navigator.userAgent.includes('HelixDesktop');
      if (isActuallyDesktop) {
        onChatModeChange(mode)
        setModeDropdownOpen(false)
        return
      }

      // Pro+ or Ultra on Web -> Show download prompt
      setShowGetAgentPopup(true)
      setModeDropdownOpen(false)
      return
    }
    onChatModeChange(mode)
    setModeDropdownOpen(false)
  }

  const [showUploadBlocker, setShowUploadBlocker] = useState(false)

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Simplified logic for "Already reached limit"
    // In a real app we'd track timestamp. Here we just show the selector if not blocked.
    fileInputRef.current?.click()
  }

  // Animation logic omitted for brevity in write_to_file but I will include it to maintain file integrity
  // Note: I will keep the border animation logic as requested to maintain "Helix" premium feel
  
  const startDictBorder = () => {
    const canvas = dictCanvasRef.current; if (!canvas) return
    const container = canvas.parentElement; if (!container) return
    canvas.width = container.offsetWidth + 4; canvas.height = container.offsetHeight + 4
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const W = canvas.width, H = canvas.height, R = 30
    const drawPath = () => { ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(W - R, 0); ctx.arcTo(W, 0, W, R, R); ctx.lineTo(W, H - R); ctx.arcTo(W, H, W - R, H, R); ctx.lineTo(R, H); ctx.arcTo(0, H, 0, H - R, R); ctx.lineTo(0, R); ctx.arcTo(0, 0, R, 0, R); ctx.closePath() }
    const perimeter = 2 * (W + H) - 8 * R + 2 * Math.PI * R
    const angleToPoint = (t: number) => { const p = t * perimeter; const top = W - 2 * R + Math.PI * R / 2; const right = top + H - 2 * R + Math.PI * R / 2; const bottom = right + W - 2 * R + Math.PI * R / 2; if (p < top) return { x: R + p, y: 0 }; if (p < right) { const d = p - top; return { x: W, y: R + d } }; if (p < bottom) { const d = p - right; return { x: W - R - d, y: H } }; return { x: 0, y: H - R - (p - bottom) } }
    const draw = () => { dictRAFRef.current = requestAnimationFrame(draw); ctx.clearRect(0, 0, W, H); ctx.save(); drawPath(); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); dictAngleRef.current = (dictAngleRef.current + 0.004) % 1; const pt = angleToPoint(dictAngleRef.current); const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 140); grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.15, 'rgba(255,255,255,0.7)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.2)'); grad.addColorStop(1, 'rgba(255,255,255,0)'); ctx.save(); drawPath(); ctx.strokeStyle = grad; ctx.lineWidth = 3; ctx.stroke(); ctx.restore() }; draw()
  }
  const stopDictBorder = () => { if (dictRAFRef.current) cancelAnimationFrame(dictRAFRef.current); const canvas = dictCanvasRef.current; if (canvas) canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height) }
  
  const startGhostBorder = () => {
    const canvas = ghostCanvasRef.current; if (!canvas) return
    const container = canvas.parentElement; if (!container) return
    canvas.width = container.offsetWidth + 4; canvas.height = container.offsetHeight + 4
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const W = canvas.width, H = canvas.height, R = 30
    const drawPath = () => { ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(W - R, 0); ctx.arcTo(W, 0, W, R, R); ctx.lineTo(W, H - R); ctx.arcTo(W, H, W - R, H, R); ctx.lineTo(R, H); ctx.arcTo(0, H, 0, H - R, R); ctx.lineTo(0, R); ctx.arcTo(0, 0, R, 0, R); ctx.closePath() }
    const perimeter = 2 * (W - 2*R) + 2 * (H - 2*R) + 2 * Math.PI * R
    const ptAt = (t: number) => { const p = ((t % 1) + 1) % 1 * perimeter; const top = W - 2*R, right = top + H - 2*R, bottom = right + W - 2*R; if (p <= top) return { x: R + p, y: 0 }; if (p <= right) return { x: W, y: R + (p - top) }; if (p <= bottom) return { x: W - R - (p - right), y: H }; return { x: 0, y: H - R - (p - bottom) } }
    const draw = () => { ghostRAFRef.current = requestAnimationFrame(draw); ctx.clearRect(0, 0, W, H); ctx.save(); drawPath(); ctx.strokeStyle = 'rgba(120,80,200,0.2)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); ghostAngleRef.current = (ghostAngleRef.current + 0.0025) % 1; const pt = ptAt(ghostAngleRef.current); const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 150); g.addColorStop(0, 'rgba(180,120,255,1)'); g.addColorStop(0.2, 'rgba(150,90,240,0.6)'); g.addColorStop(0.5, 'rgba(120,60,200,0.2)'); g.addColorStop(1, 'rgba(100,50,180,0)'); ctx.save(); drawPath(); ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore() }; draw()
  }
  const stopGhostBorder = () => { if (ghostRAFRef.current) cancelAnimationFrame(ghostRAFRef.current); const canvas = ghostCanvasRef.current; if (canvas) canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height) }

  useEffect(() => { if (isGhostMode) startGhostBorder(); else stopGhostBorder(); return () => stopGhostBorder() }, [isGhostMode])
  useEffect(() => () => { stopDictBorder(); stopGhostBorder() }, [])

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showGetAgentPopup && !target.closest('.agent-get-popup') && !target.closest('.mode-pill-wrap')) setShowGetAgentPopup(false)
      if (showUpgradeProPopup && !target.closest('.upgrade-attach-popup') && !target.closest('.mode-pill-wrap')) setShowUpgradeProPopup(false)
      if (modeDropdownOpen && !target.closest('.mode-pill-wrap')) setModeDropdownOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showGetAgentPopup, showUpgradeProPopup, modeDropdownOpen])

  const hasContent = (value || '').trim().length > 0 || uploadedImages.length > 0

  return (
    <div className="input-section">
      <div className={`input-container ${isGhostMode ? 'ghost-mode' : ''} ${isDictating ? 'dictating' : ''}`}>
        <canvas ref={dictCanvasRef} id="dictBorderCanvas"></canvas>
        <canvas ref={ghostCanvasRef} id="ghostBorderCanvas"></canvas>
        
        {uploadedImages.length > 0 && (
          <div className="image-preview-container active">
            {uploadedImages.map((src, i) => (
              <div key={i} className="image-preview">
                <img src={src} alt="" />
                <button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))} className="remove-image">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="input-wrapper">
          <div className="textarea-wrapper">
            {agentPrompt ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                {[{ key: 'execute' as const, label: 'Do it for me' }, { key: 'explain' as const, label: 'Explain it' }].map(opt => (
                  <div key={opt.key} onClick={() => !agentRunning && setAgentChoice(opt.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: agentRunning ? 'not-allowed' : 'pointer', padding: '2px 0' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${agentChoice === opt.key ? '#fff' : '#444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}>
                      {agentChoice === opt.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: 15, color: agentChoice === opt.key ? '#fff' : '#888', transition: 'color 0.15s', userSelect: 'none' }}>{opt.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <textarea ref={textareaRef} value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} onInput={handleInput} placeholder={isGhostMode ? 'Ghost Mode — no traces...' : (chatActive ? 'Reply Helix...' : 'Ask, recon, or hack something')} id="messageInput" spellCheck={false} />
            )}
          </div>

          <div className="input-footer">
            <div className="input-actions">
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
              <button onClick={handleUploadClick} className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>

              <div className="mode-pill-wrap">
                <button onClick={() => { setModeDropdownOpen(o => !o); setShowGetAgentPopup(false); setShowUpgradeProPopup(false) }} className={`mode-pill ${chatMode === 'agent' ? 'agent-active' : ''}`}>
                  {chatMode === 'agent' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="6" y1="8" x2="6" y2="8.01"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="6" y2="11.01"/><line x1="10" y1="11" x2="14" y2="11"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  )}
                  {chatMode === 'chat' ? 'Chat' : 'Agent'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {modeDropdownOpen && (
                  <div className="mode-dropdown active">
                    {[
                      { mode: 'chat' as ChatMode, label: 'Chat', desc: 'Ask your hacking questions', icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
                      { mode: 'agent' as ChatMode, label: 'Agent', desc: 'Hack, test, secure anything', icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="6" y1="8" x2="6" y2="8.01"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="6" y2="11.01"/><line x1="10" y1="11" x2="14" y2="11"/></> },
                    ].filter(opt => opt.mode !== chatMode).map(opt => (
                      <div key={opt.mode} className="mode-option" onClick={() => handleModeChange(opt.mode)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{opt.icon}</svg>
                        <div className="mode-option-content"><div className="mode-option-title">{opt.label}</div><div className="mode-option-desc">{opt.desc}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="right-actions">
              <button className={`icon-btn ${isDictating ? 'active' : ''}`} onClick={() => { setIsDictating(!isDictating); if (!isDictating) startDictBorder(); else stopDictBorder() }} title="Voice Dictation">
                {!isDictating ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                )}
              </button>
              <button onClick={agentPrompt ? () => { if (agentChoice === 'execute') onAgentExecute?.(); else if (agentChoice === 'explain') onAgentExplain?.(); setAgentChoice(null) } : isTyping ? onStop : handleSend} className={agentPrompt ? `send-btn ${agentChoice ? 'send-mode' : 'voice-mode'}` : isTyping ? 'send-btn stop-mode' : `send-btn ${hasContent ? 'send-mode' : 'voice-mode'}`} title={agentPrompt ? 'Submit' : isTyping ? 'Stop' : 'Send'} disabled={agentPrompt ? !agentChoice || agentRunning : false}>
                {isTyping ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg> : <svg className="icon-send" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Pro+ for Agent mode Popup */}
      {showUpgradeProPopup && (
        <div className="upgrade-attach-popup active upgrade-agent-popup" style={{ left: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>🔒 Premium Feature</h3>
            <button onClick={() => setShowUpgradeProPopup(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>
          <p>Agent Mode requires a <strong>Pro+</strong> or <strong>Ultra</strong> subscription. Elite autonomous workflows are not available on your current plan.</p>
          <a href="/pricing" className="upgrade-attach-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>See pricing</a>
        </div>
      )}

      {/* Get Agent Mode Popup */}
      {showGetAgentPopup && (
        <div className="upgrade-attach-popup active agent-get-popup" style={{ left: 20, bottom: 80, width: 340, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Get Agent mode</h3>
            <button onClick={() => setShowGetAgentPopup(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Connect a local sandbox to use Agent mode for free.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div onClick={() => { setShowGetAgentPopup(false); window.open('/download', '_blank') }} className="agent-option-card">
              <div className="agent-option-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div className="agent-option-text">
                <div className="agent-option-title">Desktop App</div>
                <div className="agent-option-desc">Download and run locally</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
