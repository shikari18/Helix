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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 20px', overflowY: 'auto' }}>
      <style>{`
        body { background: #0a0a0a !important; margin: 0; overflow-y: auto !important; height: auto !important; }
        .download-btn:hover { background: #e0e0e0 !important; transform: scale(1.02); }
        .platform-item:hover { background: #1a1a1a !important; border-color: #333 !important; }
        .req-card { background: #111; border: 1px solid #1a1a1a; border-radius: 20px; padding: 32px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); flex: 1; }
        .req-card:hover { border-color: #333; transform: translateY(-4px); background: #141414; }
        .req-card h3 { font-size: 18, font-weight: 700; margin-bottom: 24px; display: flex; alignItems: center; gap: 12px; }
        .req-list { list-style: none; padding: 0; margin: 0; display: flex; flexDirection: column; gap: 16px; }
        .req-item { display: flex; flex-direction: column; gap: 4px; }
        .req-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .req-value { font-size: 15px; color: #eee; }
      `}</style>

      {/* Mini Header */}
      <nav style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700 }}>
          <img src="/image.png" alt="" style={{ width: 24, height: 24, mixBlendMode: 'screen' }} />
          Helix
        </div>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Chat
        </Link>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 60, textAlign: 'center', paddingBottom: 100 }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>Download Helix</h1>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 40 }}>Get the desktop app for the best experience</p>

        {/* Primary Download Box */}
        <div style={{ 
          background: '#0d0d0d', 
          border: '1px solid #1a1a1a', 
          borderRadius: 24, 
          padding: '100px 40px',
          maxWidth: 960,
          margin: '0 auto 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#fff"><path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/></svg>
          
          <a 
            href="https://github.com/shikari18/Helix/releases/download/v1.0.0/helix-app.Setup.0.1.0.exe" 
            className="download-btn"
            style={{
            background: '#fff',
            color: '#000',
            padding: '14px 40px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.2s'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Helix for Windows
          </a>
        </div>

        {/* Desktop Downloads Grid */}
        <div style={{ 
          background: '#0d0d0d', 
          border: '1px solid #1a1a1a', 
          borderRadius: 24, 
          padding: '40px',
          maxWidth: 960,
          margin: '0 auto 80px',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 28 }}>Desktop Downloads</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <PlatformItem os="macOS" sub="Universal (Intel & Apple Silicon)" icon={<path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/>} />
            <PlatformItem os="Windows" sub="64-bit" icon={<path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/>} />
            <PlatformItem os="Linux" sub="x64 (.deb)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="ARM64 (.deb)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="x64 (.AppImage)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="ARM64 (.AppImage)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
          </div>
        </div>

        {/* Requirements Cards Section */}
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'left' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>System Requirements</h2>
          
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Windows Card */}
            <div className="req-card">
              <h3 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#0078d4' }}><path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/></svg>
                Requirements for Windows
              </h3>
              <div className="req-list">
                <div className="req-item"><div className="req-label">Processor</div><div className="req-value">Quad-core Intel i5 / Ryzen 5 or better</div></div>
                <div className="req-item"><div className="req-label">Memory</div><div className="req-value">8GB RAM Minimum (16GB for Agent)</div></div>
                <div className="req-item"><div className="req-label">Graphics</div><div className="req-value">DirectX 12 capable GPU</div></div>
                <div className="req-item"><div className="req-label">Storage</div><div className="req-value">2GB available space</div></div>
              </div>
            </div>

            {/* Apple Card */}
            <div className="req-card">
              <h3 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}><path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/></svg>
                Requirements for Apple
              </h3>
              <div className="req-list">
                <div className="req-item"><div className="req-label">Processor</div><div className="req-value">Apple Silicon M1/M2/M3 or Intel i5</div></div>
                <div className="req-item"><div className="req-label">Memory</div><div className="req-value">8GB Unified Memory Minimum</div></div>
                <div className="req-item"><div className="req-label">OS</div><div className="req-value">macOS 12.0 Monterey or later</div></div>
                <div className="req-item"><div className="req-label">Storage</div><div className="req-value">1.5GB available space</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Removed Footer as requested */}
      </main>
    </div>
  )
}

function PlatformItem({ os, sub, icon }: { os: string, sub: string, icon: React.ReactNode }) {
  return (
    <a href="#" className="platform-item" style={{
      background: '#141414',
      border: '1px solid #1a1a1a',
      borderRadius: 16,
      padding: '24px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      textDecoration: 'none',
      color: '#fff',
      transition: 'all 0.2s'
    }}>
      <div style={{ color: '#666' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">{icon}</svg>
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{os}</div>
        <div style={{ fontSize: 13, color: '#444' }}>{sub}</div>
      </div>
    </a>
  )
}
