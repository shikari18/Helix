'use client'

import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const NAV = [
  { id: 'account', label: 'Account', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
  { id: 'personalization', label: 'Personalization', icon: <><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></> },
  { id: 'privacy', label: 'Privacy', icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> },
  { id: 'billing', label: 'Billing & Plan', icon: <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></> },
  { id: 'notifications', label: 'Notifications', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
  { id: 'security', label: 'Security', icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></> },
  { id: 'legal', label: 'Legal', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
]

export default function SettingsOverlay({ isOpen, onClose }: Props) {
  const [activeSection, setActiveSection] = useState('account')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPicture, setUserPicture] = useState('')
  const [plan, setPlan] = useState('free')
  const [editName, setEditName] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [chatHistory, setChatHistory] = useState(true)
  const [improveAI, setImproveAI] = useState(true)
  const [emailNotifs, setEmailNotifs] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('English')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showContextModal, setShowContextModal] = useState(false)
  const [ctxNickname, setCtxNickname] = useState('')
  const [ctxOccupation, setCtxOccupation] = useState('')
  const [ctxPersonality, setCtxPersonality] = useState('Default')
  const [ctxTraits, setCtxTraits] = useState<string[]>([])
  const [ctxMore, setCtxMore] = useState('')

  const TRAIT_OPTIONS = ['Methodical', 'Detail-oriented', 'Thorough', 'Risk-aware', 'Tool-savvy', 'Creative', 'Concise', 'Aggressive']

  const saveContext = () => {
    const ctx = { nickname: ctxNickname, occupation: ctxOccupation, personality: ctxPersonality, traits: ctxTraits, more: ctxMore }
    localStorage.setItem('helix_user_context', JSON.stringify(ctx))
    setShowContextModal(false)
  }

  const openContextModal = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('helix_user_context') || '{}')
      setCtxNickname(saved.nickname || userName)
      setCtxOccupation(saved.occupation || '')
      setCtxPersonality(saved.personality || 'Default')
      setCtxTraits(saved.traits || [])
      setCtxMore(saved.more || '')
    } catch {}
    setShowContextModal(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('helix_user_name') || ''
      const email = localStorage.getItem('helix_user_email') || ''
      const pic = localStorage.getItem('helix_user_picture') || ''
      const p = localStorage.getItem('helix_plan') || 'free'
      setUserName(name)
      setEditName(name)
      setUserEmail(email)
      setUserPicture(pic)
      setPlan(p)
    }
  }, [isOpen])

  const saveName = () => {
    if (editName.trim()) {
      localStorage.setItem('helix_user_name', editName.trim())
      setUserName(editName.trim())
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 2000)
    }
  }

  const getPlanLabel = () => {
    if (plan === 'ultra') return 'Ultra'
    if (plan === 'proplus') return 'Pro+'
    if (plan === 'pro') return 'Pro'
    return 'Free'
  }

  const userInitial = userName.charAt(0).toUpperCase() || '?'

  if (!isOpen) return null

  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isMobileView ? '100%' : 980,
        maxWidth: isMobileView ? '100%' : '95vw',
        height: isMobileView ? '92vh' : 680,
        maxHeight: '92vh',
        background: '#111', borderRadius: isMobileView ? '20px 20px 0 0' : 20,
        border: '1px solid #222', boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        display: 'flex', flexDirection: isMobileView ? 'column' : 'row',
        overflow: 'hidden',
        animation: 'settingsFadeIn 0.2s ease-out',
        position: isMobileView ? 'absolute' : 'relative',
        bottom: isMobileView ? 0 : 'auto',
      }}>
        <style>{`
          @keyframes settingsFadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
          .s-nav-item { display: flex; align-items: center; gap: 10px; padding: 13px 14px; border-radius: 10px; cursor: pointer; font-size: 15.5px; color: #666; transition: all 0.15s; }
          .s-nav-item:hover { background: #1a1a1a; color: #ccc; }
          .s-nav-item.active { background: #1e1e1e; color: #fff; }
          .s-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #1a1a1a; gap: 16px; flex-wrap: wrap; }
          .s-row:last-child { border-bottom: none; }
          .s-label { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 3px; }
          .s-desc { font-size: 12px; color: #555; }
          .s-input { background: #1a1a1a; border: 1px solid #2d2d2d; border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 13px; font-family: inherit; outline: none; width: 200px; }
          .s-input:focus { border-color: #444; }
          .s-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: #fff; font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
          .s-btn:hover { background: #222; border-color: #444; }
          .s-btn.primary { background: #fff; color: #000; border-color: #fff; }
          .s-btn.primary:hover { background: #e0e0e0; }
          .s-btn.danger { background: transparent; color: #ff4444; border-color: #ff4444; }
          .s-btn.danger:hover { background: rgba(255,68,68,0.1); }
          .s-toggle { width: 44px; height: 26px; border-radius: 13px; cursor: pointer; transition: background 0.25s; position: relative; flex-shrink: 0; border: none; outline: none; }
          .s-toggle-knob { width: 20px; height: 20px; border-radius: 50%; background: #fff; position: absolute; top: 3px; transition: left 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
        `}</style>

        {/* Left nav — desktop sidebar / mobile top tabs */}
        {!isMobileView ? (
          <div style={{ width: 200, borderRight: '1px solid #1a1a1a', padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', padding: '0 14px 16px', letterSpacing: '-0.3px' }}>Settings</div>
            {NAV.map(n => (
              <div key={n.id} className={`s-nav-item ${activeSection === n.id ? 'active' : ''}`} onClick={() => setActiveSection(n.id)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
                {n.label}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Settings</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', overflowX: 'auto', gap: 4, padding: '12px 16px', scrollbarWidth: 'none' }}>
              {NAV.map(n => (
                <button key={n.id} onClick={() => setActiveSection(n.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: activeSection === n.id ? '#fff' : '#1a1a1a',
                  color: activeSection === n.id ? '#000' : '#888',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0,
                  transition: 'all 0.15s',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.icon}</svg>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobileView ? '20px 20px' : '24px 28px', position: 'relative' }}>
          {!isMobileView && (
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}

          {/* ACCOUNT */}
          {activeSection === 'account' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Account</div>

              {/* Profile card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: '#1a1a1a', borderRadius: 14, marginBottom: 24, border: '1px solid #222' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: '#2d2d2d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {userPicture ? <img src={userPicture} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{userName || 'User'}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{userEmail}</div>
                  <div style={{ fontSize: 11, color: '#444', marginTop: 4, background: '#222', display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>{getPlanLabel()} Plan</div>
                </div>
              </div>

              <div className="s-row">
                <div><div className="s-label">Display name</div><div className="s-desc">How Helix addresses you</div></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="s-input" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveName()} placeholder="Your name" />
                  <button className="s-btn primary" onClick={saveName}>{nameSaved ? '✓' : 'Save'}</button>
                </div>
              </div>

              <div className="s-row">
                <div><div className="s-label">Email address</div><div className="s-desc">Your login email</div></div>
                <span style={{ fontSize: 13, color: '#555' }}>{userEmail || '—'}</span>
              </div>

              <div className="s-row">
                <div><div className="s-label">Profile picture</div><div className="s-desc">Synced from your Google account</div></div>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2d2d2d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {userPicture ? <img src={userPicture} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
                </div>
              </div>

              <div className="s-row">
                <div><div className="s-label" style={{ color: '#ff4444' }}>Delete account</div><div className="s-desc">Permanently remove your account and all data</div></div>
                {deleteConfirm ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="s-btn danger" onClick={() => { localStorage.clear(); window.location.href = '/signup' }}>Confirm</button>
                    <button className="s-btn" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                  </div>
                ) : (
                  <button className="s-btn danger" onClick={() => setDeleteConfirm(true)}>Delete</button>
                )}
              </div>
            </div>
          )}

          {/* PERSONALIZATION */}
          {activeSection === 'personalization' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Personalization</div>

              <div className="s-row">
                <div><div className="s-label">Theme</div><div className="s-desc">Interface color scheme</div></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['dark', 'light', 'system'].map(t => (
                    <button key={t} className="s-btn" onClick={() => setTheme(t)} style={{ background: theme === t ? '#fff' : '#1a1a1a', color: theme === t ? '#000' : '#888', borderColor: theme === t ? '#fff' : '#333', textTransform: 'capitalize' }}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="s-row">
                <div><div className="s-label">Language</div><div className="s-desc">Preferred response language</div></div>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{ background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                  {['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese', 'Portuguese'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="s-row">
                <div><div className="s-label">What should Helix know about you?</div><div className="s-desc">Custom context for better responses</div></div>
                <button className="s-btn" onClick={openContextModal}>Edit</button>
              </div>

              <div className="s-row">
                <div><div className="s-label">Hacking style</div><div className="s-desc">Offensive, defensive, or balanced</div></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Offensive', 'Defensive', 'Balanced'].map(s => (
                    <button key={s} className="s-btn" style={{ fontSize: 12 }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY */}
          {activeSection === 'privacy' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Privacy</div>

              <div className="s-row">
                <div><div className="s-label">Save chat history</div><div className="s-desc">Store your conversations locally</div></div>
                <div className="s-toggle" onClick={() => setChatHistory(v => !v)} style={{ background: chatHistory ? '#2563eb' : '#333' }}>
                  <div className="s-toggle-knob" style={{ left: chatHistory ? 21 : 3 }} />
                </div>
              </div>

              <div className="s-row">
                <div><div className="s-label">Help improve Helix</div><div className="s-desc">Allow chats to train AI models</div></div>
                <div className="s-toggle" onClick={() => setImproveAI(v => !v)} style={{ background: improveAI ? '#2563eb' : '#333' }}>
                  <div className="s-toggle-knob" style={{ left: improveAI ? 21 : 3 }} />
                </div>
              </div>

              <div className="s-row">
                <div><div className="s-label">Clear all chat history</div><div className="s-desc">Delete all stored conversations</div></div>
                <button className="s-btn danger" onClick={() => { localStorage.removeItem('helix_messages'); window.location.reload() }}>Clear</button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {activeSection === 'billing' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Billing & Plan</div>

              <div style={{ padding: 16, background: '#1a1a1a', borderRadius: 14, border: '1px solid #222', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Current plan</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{getPlanLabel()}</div>
                {plan === 'free' && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>20 messages/day</div>}
                {plan === 'pro' && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>30 messages/day</div>}
                {plan === 'proplus' && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>100 messages/day</div>}
                {plan === 'ultra' && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Unlimited messages</div>}
              </div>

              {plan !== 'ultra' && (
                <div className="s-row">
                  <div><div className="s-label">Upgrade your plan</div><div className="s-desc">Unlock more messages, agent mode, and more</div></div>
                  <button className="s-btn primary" onClick={() => window.location.href = '/pricing'}>Upgrade</button>
                </div>
              )}

              {plan !== 'free' && (
                <div className="s-row">
                  <div><div className="s-label">Cancel subscription</div><div className="s-desc">Downgrade to the free plan</div></div>
                  <button className="s-btn danger" onClick={() => window.location.href = '/cancel-plan'}>Cancel</button>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Notifications</div>
              <div className="s-row">
                <div><div className="s-label">Email notifications</div><div className="s-desc">Receive updates and tips via email</div></div>
                <div className="s-toggle" onClick={() => setEmailNotifs(v => !v)} style={{ background: emailNotifs ? '#2563eb' : '#333' }}>
                  <div className="s-toggle-knob" style={{ left: emailNotifs ? 21 : 3 }} />
                </div>
              </div>
              <div className="s-row">
                <div><div className="s-label">Login alerts</div><div className="s-desc">Get notified of new sign-ins</div></div>
                <div className="s-toggle" style={{ background: '#2563eb' }}>
                  <div className="s-toggle-knob" style={{ left: 21 }} />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Security</div>
              <div className="s-row">
                <div><div className="s-label">Two-factor authentication</div><div className="s-desc">Add an extra layer of security</div></div>
                <button className="s-btn">Enable</button>
              </div>
              <div className="s-row">
                <div><div className="s-label">Active sessions</div><div className="s-desc">Devices currently logged in</div></div>
                <button className="s-btn danger">Sign out all</button>
              </div>
              <div className="s-row">
                <div><div className="s-label">Login method</div><div className="s-desc">Google OAuth</div></div>
                <span style={{ fontSize: 12, color: '#555', background: '#1a1a1a', padding: '4px 10px', borderRadius: 6 }}>Google</span>
              </div>
            </div>
          )}

          {/* LEGAL */}
          {activeSection === 'legal' && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Legal</div>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Review the agreements that govern your use of Helix.</div>

              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => window.open('/terms-of-service', '_blank')}>
                <div>
                  <div className="s-label">Terms of Service</div>
                  <div className="s-desc">Read the terms that apply to your use of Helix</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#555', background: '#1a1a1a', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>View</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>

              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => window.open('/privacy-policy', '_blank')}>
                <div>
                  <div className="s-label">Privacy Policy</div>
                  <div className="s-desc">Understand how Helix collects and uses your data</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#555', background: '#1a1a1a', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>View</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              </div>

              <div style={{ marginTop: 28, padding: 16, background: '#0e0e0e', borderRadius: 12, border: '1px solid #1a1a1a' }}>
                <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7 }}>
                  By using Helix, you agree to our Terms of Service and acknowledge our Privacy Policy.
                  If you have any questions, contact us at{' '}
                  <a href="mailto:support@tryhelix.ai" style={{ color: '#555', textDecoration: 'underline' }}>support@tryhelix.ai</a>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context / Personalization modal */}
      {showContextModal && (
        <div onClick={() => setShowContextModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 520, maxWidth: '95vw', maxHeight: '90vh',
            background: '#111', borderRadius: 16, border: '1px solid #222',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'settingsFadeIn 0.2s ease-out',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Personalization</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Introduce yourself to get better, more personalized responses</div>
              </div>
              <button onClick={() => setShowContextModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>What should Helix call you?</div>
                <input value={ctxNickname} onChange={e => setCtxNickname(e.target.value)} placeholder="Nickname" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>What do you do?</div>
                <input value={ctxOccupation} onChange={e => setCtxOccupation(e.target.value)} placeholder="Pentester, bug bounty hunter, etc." style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>What personality should Helix have?</div>
                <select value={ctxPersonality} onChange={e => setCtxPersonality(e.target.value)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                  {['Default', 'Direct', 'Detailed', 'Casual', 'Mentor', 'Aggressive'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>What traits should Helix have?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TRAIT_OPTIONS.map(t => (
                    <button key={t} onClick={() => setCtxTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid', borderColor: ctxTraits.includes(t) ? '#fff' : '#333', background: ctxTraits.includes(t) ? '#fff' : 'transparent', color: ctxTraits.includes(t) ? '#000' : '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      {ctxTraits.includes(t) ? '✓ ' : '+ '}{t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Anything else Helix should know about you?</div>
                <textarea value={ctxMore} onChange={e => setCtxMore(e.target.value)} placeholder="Security interests, preferred methodologies, compliance requirements" rows={3} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2d2d2d', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowContextModal(false)} className="s-btn">Cancel</button>
              <button onClick={saveContext} className="s-btn primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
