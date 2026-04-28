'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, Apple, Globe, ArrowLeft, Check } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [splashDone, setSplashDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authStep, setAuthStep] = useState<'main' | 'email' | 'otp' | 'phone'>('main')
  
  // Form State
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
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
      const res = await fetch('http://localhost:8000/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Even if email fails, we proceed to 'otp' step if a code was generated
        // (The agent will provide the code in the chat)
        setAuthStep('otp')
        return
      }
      setAuthStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send code. Make sure the Python server is running.')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async () => {
    const code = otpValues.join('')
    if (code.length < 6) { setError('Enter all 6 digits'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Invalid code'); setLoading(false); return }
      
      const blockCheck = await fetch('http://localhost:8000/api/auth/check-blocked', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      })
      const blockData = await blockCheck.json()
      if (blockData.blocked) { setError('BLOCKED'); setLoading(false); return }

      fetch('/api/admin/register-user', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: data.email, name: data.name || 'User' }) 
      }).catch(() => {})

      localStorage.setItem('helix_logged_in', 'true')
      localStorage.setItem('helix_user_name', data.name)
      localStorage.setItem('helix_user_email', data.email)
      setTimeout(() => router.push('/'), 800)
    } catch { setError('Something went wrong. Try again.'); setLoading(false) }
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true; script.defer = true
    document.head.appendChild(script)
    return () => { try { if (document.head.contains(script)) document.head.removeChild(script) } catch (e) {} }
  }, [])

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    
    const clientId = '527264492890-pf88n280plhshr7q15f8j1dptqtl87ui.apps.googleusercontent.com'
    const redirectUri = window.location.origin + '/signup'
    
    // Construct Google OAuth URL
    const scope = encodeURIComponent('openid email profile')
    const responseType = 'id_token'
    const nonce = Math.random().toString(36).substring(2)
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&prompt=select_account`
    
    const isDesktop = (window as any).helixDesktop?.isDesktop || navigator.userAgent.includes('HelixDesktop');
    if (isDesktop) {
        window.open(authUrl, 'GoogleLogin', 'width=500,height=650')
        setLoading(false) // Reset loading as user is in popup
    } else {
        window.location.href = authUrl
    }
  }

  // Handle Google Redirect Response & Message Listener
  useEffect(() => {
    // 1. Listen for messages from popups
    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type === 'google-auth-success' && event.data.idToken) {
            processIdToken(event.data.idToken)
        }
    }
    window.addEventListener('message', handleMessage)

    // 2. Process hash if we are the redirect target
    if (typeof window !== 'undefined' && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1))
      const idToken = params.get('id_token')
      
      if (idToken) {
        // If we are in a popup, tell the opener and close
        if (window.opener && window.opener !== window) {
            window.opener.postMessage({ type: 'google-auth-success', idToken }, window.location.origin)
            // Wait a moment then close
            setTimeout(() => window.close(), 500)
            return
        }
        processIdToken(idToken)
      }
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  const processIdToken = async (idToken: string) => {
    setLoading(true)
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]))
          if (payload.email) {
            // Wait for registration to finish so RegistryGuard doesn't kick us out
            await fetch('/api/admin/register-user', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ 
                email: payload.email, 
                name: payload.given_name || payload.name || 'User', 
                picture: payload.picture || null 
              }) 
            }).catch(() => {})
          }
          
          localStorage.setItem('helix_logged_in', 'true')
          localStorage.setItem('helix_user_name', payload.given_name || payload.name || 'User')
          localStorage.setItem('helix_user_email', payload.email || '')
          localStorage.setItem('helix_user_picture', payload.picture || '')
          
          // Set a default plan so we don't get redirected to /pricing immediately
          if (!localStorage.getItem('helix_plan')) {
              localStorage.setItem('helix_plan', 'free')
          }
          
          router.push('/')
    } catch (err) {
      setError('Failed to process Google login.')
      setLoading(false)
    }
  }

  const [showCountries, setShowCountries] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState({ code: 'US', dial: '+1', flag: '🇺🇸' })

  const COUNTRIES = [
    { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
    { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
    { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
    { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
    { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
    { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
    { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
    { name: 'Brazil', code: 'BR', dial: '+55', flag: '🇧🇷' },
    { name: 'Japan', code: 'JP', dial: '+81', flag: '🇯🇵' },
    { name: 'South Africa', code: 'ZA', dial: '+27', flag: '🇿🇦' },
    { name: 'Mexico', code: 'MX', dial: '+52', flag: '🇲🇽' },
    { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪' },
  ]

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.dial.includes(countrySearch)
  )

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#141414', color: '#fff', fontFamily: '-apple-system, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      
      <style>{`
        .icon-btn { width: 64px; height: 64px; border-radius: 50%; border: 1px solid #1a1a1a; display: flex; alignItems: center; justifyContent: center; cursor: pointer; transition: 0.2s; background: transparent; }
        .icon-btn:hover { background: #111; border-color: #333; }
        .btn-phone { width: 100%; max-width: 400px; padding: 18px; border-radius: 40px; border: none; background: #fff; color: #000; font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.2s; }
        .btn-phone:hover { opacity: 0.9; transform: scale(1.01); }
        .divider { display: flex; align-items: center; width: 100%; max-width: 400px; margin: 32px 0; color: #444; font-size: 14px; gap: 16px; }
        .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #1a1a1a; }
        input { background: #111; border: 1px solid #1a1a1a; border-radius: 14px; padding: 16px; color: #fff; font-size: 16px; width: 100%; box-sizing: border-box; outline: none; margin-bottom: 16px; }
        input:focus { border-color: #333; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .country-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #111; border: 1px solid #1a1a1a; border-radius: 18px; margin-top: 8px; z-index: 100; max-height: 280px; overflow-y: auto; padding: 8px; }
        .country-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.15s; }
        .country-item:hover { background: #1a1a1a; }
      `}</style>

      {/* Main Design Component */}
      <div className="fade-in" style={{ width: '100%', maxWidth: 400, textAlign: 'center', padding: '0 24px', position: 'relative' }}>
        
        {authStep === 'main' && (
          <>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 20 }}>
              <button className="icon-btn" onClick={() => setAuthStep('phone')}>
                <Phone size={24} color="#fff" />
              </button>
              <button className="icon-btn">
                <Apple size={24} color="#fff" />
              </button>
              <button className="icon-btn" onClick={() => setAuthStep('email')}>
                <Mail size={24} color="#888" />
              </button>
            </div>

            <div className="divider">or</div>

            <button className="btn-phone" onClick={handleGoogleLogin}>
              <svg width="22" height="22" viewBox="0 0 24 24" style={{ marginRight: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {authStep === 'email' && (
          <div className="fade-in">
            <button onClick={() => setAuthStep('main')} style={{ background: 'none', border: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'left' }}>Email address</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 32, textAlign: 'left' }}>We'll send you a 6-digit confirmation code.</p>
            <input 
              type="email" placeholder="Email" value={emailInput} onChange={e => setEmailInput(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
            />
            {error && <p style={{ color: '#ff4d4d', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>{error}</p>}
            <button className="btn-phone" onClick={handleSendOTP} disabled={loading}>
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        )}

        {authStep === 'phone' && (
          <div className="fade-in">
            <button onClick={() => setAuthStep('main')} style={{ background: 'none', border: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'left' }}>Phone number</h2>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 32, textAlign: 'left' }}>Secure your account with mobile verification.</p>
            
            <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
              <div 
                onClick={() => setShowCountries(!showCountries)}
                style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '18px', width: '70px', height: '62px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>{selectedCountry.code}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{selectedCountry.dial}</span>
              </div>

              {showCountries && (
                <div className="country-dropdown">
                  <input 
                    placeholder="Search country..." 
                    value={countrySearch} 
                    onChange={e => setCountrySearch(e.target.value)}
                    style={{ marginBottom: 8, fontSize: 14, padding: 12, background: '#1a1a1a' }}
                  />
                  {filteredCountries.map(c => (
                    <div key={c.code} className="country-item" onClick={() => { setSelectedCountry(c); setShowCountries(false); setCountrySearch('') }}>
                      <span style={{ fontSize: 18 }}>{c.flag}</span>
                      <span style={{ fontSize: 14, color: '#fff', flex: 1, textAlign: 'left' }}>{c.name}</span>
                      <span style={{ fontSize: 14, color: '#444' }}>{c.dial}</span>
                    </div>
                  ))}
                </div>
              )}

              <input 
                type="tel" placeholder="000 000 0000" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} autoFocus
                style={{ height: '62px' }}
              />
            </div>
            <button className="btn-phone" onClick={() => { localStorage.setItem('helix_user_email', phoneInput); localStorage.setItem('helix_logged_in', 'true'); router.push('/') }}>
              Continue
            </button>
          </div>
        )}

        {authStep === 'otp' && (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Confirm code</h2>
              <button onClick={() => setAuthStep('main')} style={{ background: 'none', border: 'none', color: '#444', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <ArrowLeft size={16} /> BACK
              </button>
            </div>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 32, textAlign: 'left' }}>Enter the 6-digit code sent to your email.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {otpValues.map((v, i) => (
                <input key={i} ref={otpRefs[i]} value={v} maxLength={1} onChange={e => {
                  const next = [...otpValues]; next[i] = e.target.value.slice(-1); setOtpValues(next);
                  if (e.target.value && i < 5) otpRefs[i+1].current?.focus();
                }} style={{ width: 44, height: 56, textAlign: 'center', fontSize: 20 }} />
              ))}
            </div>
            {error && <p style={{ color: '#ff4d4d', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
            <button className="btn-phone" onClick={handleVerifyOTP} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div style={{ marginTop: 40, color: '#666', fontSize: 12, lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <Link href="/terms" style={{ color: '#999', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>,{' '}
          <Link href="/privacy" style={{ color: '#999', textDecoration: 'none', fontWeight: 600 }}>Privacy policy</Link>
        </div>
      </div>
    </div>
  )
}
