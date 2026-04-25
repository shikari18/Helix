'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const [splashDone, setSplashDone] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // Email flow state
  const [emailStep, setEmailStep] = useState<'main' | 'email' | 'otp'>('main')
  const [emailInput, setEmailInput] = useState('')
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('blocked') || params.get('logout')) {
        localStorage.removeItem('helix_logged_in')
        localStorage.removeItem('helix_user_email')
        setSplashDone(true)
        return
      }
      
      const loggedIn = localStorage.getItem('helix_logged_in')
      if (loggedIn === 'true') router.push('/')
    }
    const timer = setTimeout(() => setSplashDone(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleSendOTP = async () => {
    if (!emailInput.includes('@')) { setError('Enter a valid email'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })
      if (!res.ok) throw new Error('Failed to send code')
      setEmailStep('otp')
    } catch {
      setError('Failed to send code. Make sure the Python server is running.')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    const code = otpValues.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Invalid code'); setLoading(false); return }

      // Check if account is blocked before allowing login
      const blockCheck = await fetch('/api/auth/check-blocked', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })
      const blockData = await blockCheck.json()
      if (blockData.blocked) {
        setError('BLOCKED')
        setLoading(false)
        return
      }

      const isNew = !localStorage.getItem(`helix_seen_${emailInput}`)
      localStorage.setItem('helix_logged_in', 'true')
      localStorage.setItem('helix_user_name', data.name)
      localStorage.setItem('helix_user_email', data.email)
      if (isNew) {
        localStorage.setItem(`helix_seen_${emailInput}`, '1')
        fetch('/api/auth/welcome', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, name: data.name }),
        }).catch(() => {})
      } else {
        fetch('/api/auth/login-alert', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, name: data.name, location: 'Unknown' }),
        }).catch(() => {})
      }
      setTimeout(() => router.push('/'), 800)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const handleOtpInput = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...otpValues]; next[i] = v; setOtpValues(next)
    if (v && i < 5) otpRefs[i + 1].current?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[i] && i > 0) otpRefs[i - 1].current?.focus()
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true; script.defer = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleGoogleLogin = async () => {
    setError('')
    const google = (window as any).google
    if (!google) { setError('Google login not ready. Please try again.'); return }
    
    let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    // Fallback to dynamic runtime config if static build variable is empty
    if (!clientId) {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const data = await res.json()
          if (data.googleClientId) clientId = data.googleClientId
        }
      } catch (err) {
        console.error("Failed to fetch dynamic googleClientId config", err)
      }
    }

    if (!clientId) {
      setError("Google Client ID is missing. Please configure it in your Render environment variables.");
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: any) => {
        if (!response.credential) { setError('Google login failed. Please try again.'); return }
        const payload = JSON.parse(atob(response.credential.split('.')[1]))
        const isNew = !localStorage.getItem(`helix_seen_${payload.email}`)

        // Register in admin registry
        if (payload.email) {
          fetch('/api/admin/register-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: payload.email, name: payload.given_name || payload.name || 'User', picture: payload.picture || null }) }).catch(() => {})
        }

        // Check if blocked before allowing login
        if (payload.email) {
          try {
            const blockCheck = await fetch('/api/auth/check-blocked', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: payload.email }),
            })
            const blockData = await blockCheck.json()
            if (blockData.blocked) {
              setError('BLOCKED')
              return
            }
          } catch {}
        }

        localStorage.setItem('helix_logged_in', 'true')
        localStorage.setItem('helix_user_name', payload.given_name || payload.name || 'User')
        localStorage.setItem('helix_user_email', payload.email || '')
        localStorage.setItem('helix_user_picture', payload.picture || '')
        if (isNew && payload.email) {
          localStorage.setItem(`helix_seen_${payload.email}`, '1')
          fetch('/api/auth/welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: payload.email, name: payload.given_name || payload.name || 'there' }) }).catch(() => {})
        } else if (payload.email) {
          fetch('/api/auth/login-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: payload.email, name: payload.given_name || payload.name || 'there', location: 'Unknown' }) }).catch(() => {})
        }
        setLoading(true)
        setTimeout(() => router.push('/'), 800)
      },
      use_fedcm_for_prompt: false,
    })
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const div = document.createElement('div')
        div.style.display = 'none'
        document.body.appendChild(div)
        google.accounts.id.renderButton(div, { type: 'standard' })
        const btn = div.querySelector('div[role="button"]') as HTMLElement
        if (btn) btn.click()
        setTimeout(() => document.body.removeChild(div), 3000)
      }
    })
  }

  const NAV_LINKS = [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Learn More', href: '/learn' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes splashSpin { to { transform: rotate(360deg); } }
        @keyframes menuSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        body { overflow: hidden !important; display: block !important; padding: 0 !important; background: #141414 !important; }
        .su-btn-google:hover { opacity: 0.88; transform: translateY(-1px); }
        .su-btn-outline:hover { border-color: #555 !important; background: rgba(255,255,255,0.04) !important; transform: translateY(-1px); }
        .su-link:hover { color: #fff !important; }
        .su-form { animation: fadeUp 0.5s ease both; }
        .nav-link-item { transition: color 0.15s, background 0.15s; }
        .nav-link-item:hover { color: #fff !important; background: rgba(255,255,255,0.03) !important; }
        .menu-btn:hover { color: #fff !important; }
      `}</style>

      {/* Blocked Screen */}
      {error === 'BLOCKED' && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
            <div style={{ width: 64, height: 64, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>🚫</div>
            <h1 style={{ color: '#f3f4f6', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>Account Suspended</h1>
            <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
              Your account has been suspended by <strong style={{ color: '#e5e7eb' }}>HELIX Core</strong>.
            </p>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: '0 0 32px' }}>
              You are no longer able to access HELIX services. If you believe this is a mistake, please contact our customer service team for assistance.
            </p>
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', fontWeight: 600 }}>Customer Support</p>
              <p style={{ color: '#e5e7eb', fontSize: 14, margin: '0 0 4px' }}>📧 {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@helixcore.ai'}</p>
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Please include your email address in your message.</p>
            </div>
            <button onClick={() => setError('')} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
              ← Back to sign in
            </button>
          </div>
        </div>
      )}

      {/* Splash */}
      {!splashDone && (
        <div style={{ position: 'fixed', inset: 0, background: '#141414', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, border: '2px solid rgba(255,255,255,0.12)', borderTopColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', animation: 'splashSpin 0.7s linear infinite' }} />
        </div>
      )}

      <div style={{ height: '100vh', width: '100vw', background: '#141414', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* ── Navbar ── */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/image.png?v=2" alt="Helix" style={{ width: 32, height: 32, objectFit: 'contain', mixBlendMode: 'screen' }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>Helix</span>
          </div>

          {/* Links */}
          <div className="desktop-links" style={{ alignItems: 'center', gap: 32 }}>
            {NAV_LINKS.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="su-link"
                style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.15s' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="desktop-links" style={{ alignItems: 'center', gap: 16 }}>
             <button onClick={() => { setIsSignUp(false); setEmailStep('main') }} className="su-link" style={{ background: 'transparent', border: 'none', color: '#ccc', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}>Sign In</button>
             <button onClick={() => { setIsSignUp(true); setEmailStep('main') }} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: '#e8e8e8', color: '#111', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Get started</button>
          </div>

          {/* Hamburger */}
          <button
            className="menu-btn mobile-toggle"
            onClick={() => setMenuOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', alignItems: 'center', justifyContent: 'center', padding: 4, transition: 'color 0.15s' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          </button>
        </nav>

        {/* ── Menu overlay ── */}
        {menuOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: '#141414', zIndex: 1000, display: 'flex', flexDirection: 'column', animation: 'menuSlideIn 0.22s ease both' }}
          >
            {/* Menu header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #222', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/image.png?v=2" alt="Helix" style={{ width: 32, height: 32, objectFit: 'contain', mixBlendMode: 'screen' }} />
                <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Helix</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 0', overflowY: 'auto' }}>
              {NAV_LINKS.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="nav-link-item"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px', color: '#aaa', textDecoration: 'none', fontSize: 18, fontWeight: 500, borderBottom: '1px solid #1e1e1e' }}
                >
                  {link.label}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </Link>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ padding: '20px 28px', borderTop: '1px solid #222', display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setMenuOpen(false); setIsSignUp(false) }}
                style={{ flex: 1, padding: '14px', borderRadius: 50, border: '1px solid #3a3a3a', background: 'transparent', color: '#ccc', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Sign in
              </button>
              <button
                onClick={() => { setMenuOpen(false); setIsSignUp(true) }}
                style={{ flex: 1, padding: '14px', borderRadius: 50, border: 'none', background: '#e8e8e8', color: '#111', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Get started
              </button>
            </div>
          </div>
        )}


        {/* ── Main content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', overflowY: 'auto' }}>
          <div className="su-form" style={{ width: '100%', maxWidth: 400 }}>

            {/* Email step */}
            {emailStep === 'email' && (
              <>
                <h1 style={{ fontSize: 30, fontWeight: 500, color: '#e8e8e8', marginBottom: 8, textAlign: 'center', letterSpacing: '-0.02em' }}>Enter your email</h1>
                <p style={{ color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>We'll send you a 6-digit code</p>
                <input
                  type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                  placeholder="you@example.com" autoFocus
                  style={{ width: '100%', padding: '15px 20px', borderRadius: 14, border: '1px solid #2e2e2e', background: '#1c1c1c', color: '#fff', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                {error && error !== 'BLOCKED' && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</p>}
                <button onClick={handleSendOTP} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: '#e8e8e8', color: '#111', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Sending...' : 'Send code →'}
                </button>
                <button onClick={() => { setEmailStep('main'); setError('') }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'none', border: 'none', color: '#666', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
              </>
            )}

            {/* OTP step */}
            {emailStep === 'otp' && (
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: 30, fontWeight: 500, color: '#e8e8e8', marginBottom: 8, letterSpacing: '-0.02em' }}>Check your email</h1>
                <p style={{ color: '#666', fontSize: 14, marginBottom: 6 }}>Code sent to</p>
                <p style={{ color: '#bbb', fontSize: 14, fontWeight: 500, marginBottom: 28 }}>{emailInput}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                  {otpValues.map((v, i) => (
                    <input key={i} ref={otpRefs[i]} value={v} maxLength={1} inputMode="numeric"
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      style={{ width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700, borderRadius: 12, border: `1px solid ${v ? '#555' : '#2a2a2a'}`, background: '#1c1c1c', color: '#fff', outline: 'none', fontFamily: 'inherit' }}
                    />
                  ))}
                </div>
                {error && error !== 'BLOCKED' && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 10 }}>{error}</p>}
                <button onClick={handleVerifyOTP} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: '#e8e8e8', color: '#111', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? 'Verifying...' : 'Verify & Sign in'}
                </button>
                <button onClick={() => { setEmailStep('email'); setOtpValues(['','','','','','']); setError('') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'none', border: 'none', color: '#666', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', margin: '0 auto' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>
              </div>
            )}

            {/* Main */}
            {emailStep === 'main' && (
              <>
                <h1 style={{ fontSize: 34, fontWeight: 500, color: '#e8e8e8', marginBottom: 10, textAlign: 'center', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h1>
                <p style={{ color: '#555', fontSize: 14, textAlign: 'center', marginBottom: 36 }}>
                  {isSignUp ? 'Start hacking smarter with Helix AI' : 'Sign in to continue to Helix'}
                </p>

                {/* Google */}
                <button className="su-btn-google" onClick={handleGoogleLogin} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#e8e8e8', color: '#1a1a1a', border: 'none', borderRadius: 14, padding: '15px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'opacity 0.18s, transform 0.15s', marginBottom: 14, opacity: loading ? 0.6 : 1, fontFamily: 'inherit' }}>
                  {loading ? (
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'splashSpin 0.6s linear infinite' }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: '#222' }} />
                  <span style={{ color: '#444', fontSize: 13 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: '#222' }} />
                </div>

                {/* Email */}
                <button className="su-btn-outline" onClick={() => { setEmailStep('email'); setError('') }} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'transparent', color: '#ccc', border: '1px solid #2e2e2e', borderRadius: 14, padding: '15px 20px', fontWeight: 500, fontSize: 15, cursor: 'pointer', transition: 'border-color 0.18s, background 0.18s, transform 0.15s', marginBottom: 10, fontFamily: 'inherit' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                  Continue with email
                </button>

                {/* X */}
                <button className="su-btn-outline" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'transparent', color: '#ccc', border: '1px solid #2e2e2e', borderRadius: 14, padding: '15px 20px', fontWeight: 500, fontSize: 15, cursor: 'pointer', transition: 'border-color 0.18s, background 0.18s, transform 0.15s', marginBottom: 10, fontFamily: 'inherit' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Continue with X
                </button>

                {error && error !== 'BLOCKED' && <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{error}</p>}

                <p style={{ fontSize: 14, color: '#555', textAlign: 'center', marginTop: 24 }}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <a href="#" className="su-link" onClick={e => { e.preventDefault(); setIsSignUp(!isSignUp) }} style={{ color: '#aaa', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}>
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </a>
                </p>

                <p style={{ fontSize: 12, color: '#444', textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
                  By continuing, you agree to Helix AI's{' '}
                  <Link href="/terms-of-service" className="su-link" style={{ color: '#666', textDecoration: 'none', transition: 'color 0.15s' }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy-policy" className="su-link" style={{ color: '#666', textDecoration: 'none', transition: 'color 0.15s' }}>Privacy Policy</Link>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
