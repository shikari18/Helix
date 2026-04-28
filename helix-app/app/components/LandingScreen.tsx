'use client'

import { useEffect, useState } from 'react'

function getUserName() {
  if (typeof window === 'undefined') return 'Shikari'
  return localStorage.getItem('helix_user_name') || 'Shikari'
}

const GREETING_TEMPLATES_LOGGEDIN = [
  "What are we testing today, {name}?",
  "What should we analyze or secure?",
  "Where do we start, {name}?",
  "Got an idea, {name}?",
  "Ready to run recon, {name}?",
]

const GREETINGS_LOGGEDOUT = [
  "The AI built for hackers.",
  "Recon. Exploit. Secure.",
  "Your pentesting co-pilot.",
]

interface Props {
  loggedIn: boolean
  greeting?: string
  animateKey?: number
}

export default function LandingScreen({ loggedIn, greeting: greetingProp, animateKey }: Props) {
  const [greeting, setGreeting] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [logoKey, setLogoKey] = useState(0)
  const [morphing, setMorphing] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [planName, setPlanName] = useState('Free plan')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const plan = localStorage.getItem('helix_plan') || 'free'
      if (plan === 'ultra') setPlanName('Ultra')
      else if (plan === 'proplus') setPlanName('Pro+')
      else if (plan === 'pro') setPlanName('Pro')
      else setPlanName('Free plan')
    }
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setLogoKey(k => k + 1)
  }, [animateKey])

  useEffect(() => {
    if (greetingProp) {
      setGreeting(greetingProp)
      if (loggedIn) localStorage.setItem('helix_greeting', greetingProp)
      return
    }
    const name = getUserName()
    const pool = loggedIn
      ? GREETING_TEMPLATES_LOGGEDIN.map(t => t.replace('{name}', name))
      : GREETINGS_LOGGEDOUT
    const stored = loggedIn ? localStorage.getItem('helix_greeting') : null
    if (stored) {
      setGreeting(stored)
    } else {
      const g = pool[Math.floor(Math.random() * pool.length)]
      setGreeting(g)
      if (loggedIn) localStorage.setItem('helix_greeting', g)
    }
  }, [loggedIn, greetingProp])

  const handleLogoClick = () => {
    setMorphing(false)
    setTimeout(() => setMorphing(true), 10)
    setTimeout(() => setMorphing(false), 510)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      marginTop: -140,
    }}>


      {/* Logo — hidden on mobile */}
      {!isMobile && (
        <div
          key={logoKey}
          style={{
            animation: 'slideDownFromTop 1.5s ease-out forwards',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
            marginBottom: 80,
            background: 'transparent',
          }}
          onClick={handleLogoClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            top: -54,
            left: '50%',
            transform: showTooltip ? 'translateX(-50%) translateY(-5px)' : 'translateX(-50%) translateY(0)',
            background: 'rgba(26,26,26,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #2d2d2d',
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 14,
            color: '#fff',
            whiteSpace: 'nowrap',
            opacity: showTooltip ? 1 : 0,
            visibility: showTooltip ? 'visible' : 'hidden',
            transition: 'opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          }}>
            Hello! I'm Helix, your agent AI
          </div>
          <img
            src="/image.png?v=2"
            alt="Helix"
            style={{
              width: 110,
              height: 110,
              objectFit: 'contain',
              display: 'block',
              mixBlendMode: 'screen',
              animation: morphing ? 'logoMorphAnim 0.5s ease-in-out' : undefined,
            }}
          />
        </div>
      )}

      {loggedIn && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          background: '#2a2a2a',
          borderRadius: 20,
          fontSize: 13,
          color: '#888',
          marginBottom: 30,
        }}>
          {planName}
          {planName !== 'Ultra' && (
            <>
              <span style={{ color: '#555' }}>·</span>
              <a href="/pricing" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Upgrade</a>
            </>
          )}
        </div>
      )}

      <h1 style={{
        fontSize: loggedIn ? (isMobile ? 19 : 28) : 36,
        fontWeight: 600,
        color: '#fff',
        textAlign: 'center',
        letterSpacing: '-0.3px',
        maxWidth: 600,
        margin: '30px 0 0 0',
      }}>
        {greeting}
      </h1>

      {!loggedIn && (
        <p style={{ fontSize: 16, color: '#555', textAlign: 'center', maxWidth: 400, marginTop: 12 }}>
          Sign in to start hacking with Helix AI.
        </p>
      )}
    </div>
  )
}
