'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux'>('windows')
  
  useEffect(() => {
    const ua = navigator.userAgent
    if (/Mac/.test(ua) && !/iPhone|iPad/.test(ua)) setPlatform('mac')
    else if (/Linux/.test(ua)) setPlatform('linux')
    else setPlatform('windows')
  }, [])

  const platformLabel = platform === 'mac' ? 'macOS' : platform === 'linux' ? 'Linux' : 'Windows'
  const platformIcon = (
    platform === 'mac' ? (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/></svg>
    ) : platform === 'linux' ? (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-.97 0-1.91.13-2.81.38C8.5 2.16 7.74 2 7 2c-2.21 0-4 1.79-4 4 0 .74.16 1.5.38 2.19C3.13 9.09 3 10.03 3 11c0 4.97 4.03 9 9 9s9-4.03 9-9c0-.97-.13-1.91-.38-2.81.22-.69.38-1.45.38-2.19 0-2.21-1.79-4-4-4-.74 0-1.5.16-2.19.38C13.91 2.13 12.97 2 12 2z"/></svg>
    ) : (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/></svg>
    )
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 20px rgba(255,255,255,0.05); }
          50% { box-shadow: 0 0 40px rgba(255,255,255,0.1); }
          100% { box-shadow: 0 0 20px rgba(255,255,255,0.05); }
        }
        .platform-card:hover {
          background: rgba(255,255,255,0.05) !important;
          border-color: rgba(255,255,255,0.2) !important;
          transform: translateY(-2px);
        }
        .main-dl-btn:hover {
          background: #e0e0e0 !important;
          transform: scale(1.02);
        }
        .nav-link:hover {
          color: #fff !important;
        }
      `}</style>

      {/* Navigation */}
      <nav style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/image.png" alt="" style={{ width: 32, height: 32, mixBlendMode: 'screen' }} />
          Helix
        </Link>
        <Link href="/" className="nav-link" style={{ color: '#666', textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Chat
        </Link>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.03em' }}>
          Download Helix
        </h1>
        <p style={{ fontSize: 20, color: '#888', marginBottom: 48, maxWidth: 640, margin: '0 auto 48px' }}>
          Experience the full power of Helix with native performance, system-level integration, and ultimate privacy.
        </p>

        {/* Primary Download Card */}
        <div style={{ 
          background: '#111', 
          border: '1px solid #222', 
          borderRadius: 24, 
          padding: '60px 40px',
          marginBottom: 80,
          position: 'relative',
          overflow: 'hidden',
          animation: 'glow 4s infinite ease-in-out'
        }}>
          {/* Subtle background glow */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 50%)', pointerEvents: 'none' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ color: '#fff', marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
              {platformIcon}
            </div>
            <a href="#" className="main-dl-btn" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '18px 48px',
              background: '#fff',
              color: '#000',
              borderRadius: 14,
              fontSize: 18,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download for {platformLabel}
            </a>
            <p style={{ marginTop: 24, color: '#444', fontSize: 14 }}>
              Current Version: 1.2.0 • Stable Release
            </p>
          </div>
        </div>

        {/* Detailed Writings Section */}
        <div style={{ textAlign: 'left', marginBottom: 100 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 40, textAlign: 'center' }}>Why the Desktop App?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {[
              {
                title: "Native Performance",
                text: "Bypass browser engine limitations. Helix Desktop uses a dedicated runtime optimized for low-latency AI inference and fluid UI interactions, even during complex agent tasks.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              },
              {
                title: "Ultimate Privacy",
                text: "Local encrypted storage ensures your chat history never leaves your machine unless you want it to. Hardware-level isolation provides a secure environment for sensitive operations.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              },
              {
                title: "System Integration",
                text: "Unlock full file system access and terminal execution. On desktop, Helix can automate local workflows, run scripts, and manage your dev environment directly.",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              }
            ].map((feature, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a', padding: 32, borderRadius: 20 }}>
                <div style={{ marginBottom: 20, background: '#222', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{feature.title}</h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Other Platforms Grid (Inspired by the screenshot) */}
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Desktop Downloads</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { os: "macOS", sub: "Universal (Intel & Apple Silicon)", icon: <path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/> },
              { os: "Windows", sub: "64-bit Installer", icon: <path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/> },
              { os: "Linux", sub: "x64 (.deb)", icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/> },
              { os: "Linux", sub: "x64 (.AppImage)", icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/> },
            ].map((item, i) => (
              <a href="#" key={i} className="platform-card" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #111',
                borderRadius: 16,
                textDecoration: 'none',
                color: '#fff',
                transition: 'all 0.2s'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#666">{item.icon}</svg>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.os}</div>
                  <div style={{ fontSize: 12, color: '#444' }}>{item.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 100, borderTop: '1px solid #111', padding: '40px 0', color: '#444', fontSize: 13 }}>
          © 2024 Helix • Crafted for the Next Generation of Hacking
        </div>
      </main>
    </div>
  )
}
