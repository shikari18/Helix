'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux'>('windows')
  
  useEffect(() => {
    const ua = navigator.userAgent
    if (/Mac/.test(ua) && !/iPhone|iPad/.test(ua)) setPlatform('mac')
    else if (/Linux/.test(ua)) setPlatform('linux')
    else setPlatform('windows')
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 20px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <style>{`
        body { background: #0a0a0a !important; margin: 0; overflow-y: auto !important; height: auto !important; }
        .download-btn:hover { background: #e0e0e0 !important; transform: scale(1.02); }
        .platform-item:hover { background: #161616 !important; border-color: #333 !important; }
        .back-link:hover { color: #fff !important; }
        .req-card { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; transition: border-color 0.2s; }
        .req-card:hover { border-color: #333; }
      `}</style>

      {/* Mini Header */}
      <nav style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700 }}>
          <img src="/image.png" alt="" style={{ width: 24, height: 24, mixBlendMode: 'screen' }} />
          Helix
        </div>
        <Link href="/" className="back-link" style={{ color: '#666', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Chat
        </Link>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 60, textAlign: 'center', paddingBottom: 100 }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 12 }}>Download Helix</h1>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>Get the desktop app for the best experience</p>

        {/* Primary Download Box (HackerAI Style) */}
        <div style={{ 
          background: '#0d0d0d', 
          border: '1px solid #1a1a1a', 
          borderRadius: 20, 
          padding: '80px 40px',
          maxWidth: 900,
          margin: '0 auto 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="#fff"><path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/></svg>
          
          <a href="#" className="download-btn" style={{
            background: '#fff',
            color: '#000',
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download for Windows
          </a>
        </div>

        {/* Desktop Downloads Grid (HackerAI Style) */}
        <div style={{ 
          background: '#0d0d0d', 
          border: '1px solid #1a1a1a', 
          borderRadius: 20, 
          padding: '40px',
          maxWidth: 900,
          margin: '0 auto 60px',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Desktop Downloads</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <PlatformItem os="macOS" sub="Universal (Intel & Apple Silicon)" icon={<path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/>} />
            <PlatformItem os="Windows" sub="64-bit" icon={<path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/>} />
            <PlatformItem os="Linux" sub="x64 (.deb)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="ARM64 (.deb)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="x64 (.AppImage)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="ARM64 (.AppImage)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
          </div>
        </div>

        {/* Requirements Section */}
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'left', maxWidth: 900, margin: '0 auto 24px' }}>System Requirements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 900, margin: '0 auto', textAlign: 'left' }}>
          <div className="req-card">
            <div style={{ color: '#5a5aff', fontWeight: 600, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Processor</div>
            <div style={{ fontSize: 15, color: '#eee' }}>Quad-core Intel i5 / Apple M1 or better</div>
          </div>
          <div className="req-card">
            <div style={{ color: '#5a5aff', fontWeight: 600, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Memory (RAM)</div>
            <div style={{ fontSize: 15, color: '#eee' }}>8GB Minimum<br/>16GB Recommended</div>
          </div>
          <div className="req-card">
            <div style={{ color: '#5a5aff', fontWeight: 600, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Graphics</div>
            <div style={{ fontSize: 15, color: '#eee' }}>NVIDIA GTX 1060 / Apple GPU or equivalent</div>
          </div>
        </div>

        <div style={{ marginTop: 40, color: '#333', fontSize: 12 }}>
            Current Version: 1.2.0 • Stable Release • <span style={{ color: '#5a5aff' }}>Strong PC Required for Agent Mode</span>
        </div>
      </main>
    </div>
  )
}

function PlatformItem({ os, sub, icon }: { os: string, sub: string, icon: React.ReactNode }) {
  return (
    <a href="#" className="platform-item" style={{
      background: '#111',
      border: '1px solid #1a1a1a',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      textDecoration: 'none',
      color: '#fff',
      transition: 'all 0.2s'
    }}>
      <div style={{ color: '#666' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">{icon}</svg>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{os}</div>
        <div style={{ fontSize: 12, color: '#444' }}>{sub}</div>
      </div>
    </a>
  )
}
