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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 20px' }}>
      <style>{`
        body { background: #0a0a0a !important; margin: 0; }
        .download-btn:hover { background: #e0e0e0 !important; }
        .platform-item:hover { background: #161616 !important; border-color: #333 !important; }
        .back-link:hover { color: #fff !important; }
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

      {/* Main Content */}
      <main style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 60, textAlign: 'center', paddingBottom: 100 }}>
        <h1 style={{ fontSize: 60, fontWeight: 800, marginBottom: 12 }}>Download Helix</h1>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 60, maxWidth: 640, margin: '0 auto 60px', lineHeight: 1.6 }}>
          Experience the full power of Helix with native performance, system-level integration, and ultimate privacy.
        </p>

        {/* Windows Main Download Box */}
        <div style={{ 
          background: '#0d0d0d', 
          border: '1px solid #1a1a1a', 
          borderRadius: 16, 
          padding: '80px 40px',
          maxWidth: 900,
          margin: '0 auto 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32
        }}>
          <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#666"><path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/></svg>
                <div style={{ fontSize: 12, color: '#444' }}>Windows</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#666"><path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/></svg>
                <div style={{ fontSize: 12, color: '#444' }}>macOS</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#888"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 12l2 2 4-4"/></svg>
                <div style={{ fontSize: 12, color: '#444' }}>Linux</div>
            </div>
          </div>
          
          <a href="#" className="download-btn" style={{
            background: '#fff',
            color: '#000',
            padding: '16px 48px',
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            transition: 'background 0.2s'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download for Desktop
          </a>
          
          <div style={{ color: '#333', fontSize: 13, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            <span>Current Version: 1.2.0</span>
            <span>•</span>
            <span>Stable Release</span>
            <span>•</span>
            <span style={{ color: '#5a5aff', fontWeight: 600 }}>Strong PC Recommended for Agent Mode</span>
          </div>
        </div>

        {/* Desktop Downloads Section */}
        <div style={{ 
          background: '#0d0d0d', 
          border: '1px solid #1a1a1a', 
          borderRadius: 16, 
          padding: 40,
          maxWidth: 900,
          margin: '0 auto 60px',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>System-Specific Downloads</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <PlatformItem os="macOS" sub="Universal (Intel & Apple Silicon)" icon={<path d="M17.05 20.28c-.96.94-2.04 1.72-3.13 1.72-1.12 0-1.46-.68-2.73-.68-1.29 0-1.68.66-2.73.68-1.07.02-2.11-.76-3.13-1.72C3.39 18.42 2 15.22 2 12.18c0-3.12 2.01-4.78 3.96-4.78 1.04 0 2.02.72 2.66.72.63 0 1.76-.84 3.01-.84 1.29 0 2.4.47 3.14 1.13-1.6 1.34-1.34 3.73.34 4.88-.69 1.69-1.57 3.32-3.06 5.99zM12.03 7.25c-.02-2.23 1.84-4.13 4.01-4.25.18 2.21-2.12 4.25-4.01 4.25z"/>} />
            <PlatformItem os="Windows" sub="Windows 10/11 (64-bit)" icon={<path d="M3 5.544l7.007-.959v6.526H3V5.544zm7.007 6.551v6.526L3 17.662v-5.567h7.007zm1.085-6.7l9.908-1.395v8.095h-9.908V5.395zm9.908 7.689l-9.908.011v8.118l9.908-1.385v-6.744z"/>} />
            <PlatformItem os="Linux" sub="x64 (.deb) / Ubuntu / Debian" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="ARM64 (.deb) / Raspberry Pi" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="x64 (.AppImage)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
            <PlatformItem os="Linux" sub="ARM64 (.AppImage)" icon={<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>} />
          </div>
        </div>

        {/* Minimum Requirements */}
        <div style={{ textAlign: 'left', maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Performance Requirements</h3>
            <ul style={{ color: '#666', listStyle: 'none', padding: 0, margin: 0, lineHeight: 2 }}>
              <li><strong style={{ color: '#888' }}>OS:</strong> Windows 10/11, macOS 12+, Ubuntu 20.04+</li>
              <li><strong style={{ color: '#888' }}>RAM:</strong> 8GB minimum (16GB recommended for Agents)</li>
              <li><strong style={{ color: '#888' }}>CPU:</strong> Modern Quad-core (Intel i5/M1 or better)</li>
              <li><strong style={{ color: '#888' }}>Storage:</strong> 1GB free space for local models</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Why Desktop?</h3>
            <p style={{ color: '#666', lineHeight: 1.7 }}>
              Helix Desktop is a hacking-focused AI environment. By running natively, it bypasses browser sandboxing, allowing the Agent to interact with your local file system, run shell commands, and manage network resources directly.
            </p>
            <p style={{ color: '#666', lineHeight: 1.7, marginTop: 12 }}>
                <strong style={{ color: '#fff' }}>Agent Mode:</strong> Advanced autonomous workflows are only available on the desktop app due to high resource requirements.
            </p>
          </div>
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
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      textDecoration: 'none',
      color: '#fff',
      transition: 'all 0.2s'
    }}>
      <div style={{ color: '#444' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">{icon}</svg>
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{os}</div>
        <div style={{ fontSize: 13, color: '#333' }}>{sub}</div>
      </div>
    </a>
  )
}
