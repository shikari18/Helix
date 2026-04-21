'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

export default function DownloadPage() {
  const [splashDone, setSplashDone] = useState(false)
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux'>('windows')
  const sectionsRef = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const ua = navigator.userAgent
    if (/Mac/.test(ua) && !/iPhone|iPad/.test(ua)) setPlatform('mac')
    else if (/Linux/.test(ua)) setPlatform('linux')
    else setPlatform('windows')
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('dl-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    sectionsRef.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [splashDone])

  const platformLabel = platform === 'mac' ? 'Download for macOS' : platform === 'linux' ? 'Download for Linux' : 'Download for Windows'
  const platformNote = platform === 'mac' ? 'macOS 12 Monterey or later' : platform === 'linux' ? 'Ubuntu 20.04+ / Debian 11+' : 'Windows 10/11 64-bit'

  return (
    <>
      <style>{`
        body { overflow: auto !important; display: block !important; padding: 0 !important; }
        .dl-animate {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .dl-animate.dl-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .dl-perf-fill {
          height: 100%;
          border-radius: 4px;
          background: #fff;
          width: 0;
          transition: width 1.4s ease;
        }
        .dl-perf-fill.browser { background: #2a2a2a; }
        .dl-animate.dl-visible .dl-perf-fill { width: var(--w); }
        .agent-step {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #161616;
          border-radius: 10px;
          border: 1px solid #1e1e1e;
          font-size: 13px;
          color: #555;
          opacity: 0;
          animation: stepIn 0.4s ease forwards;
        }
        .agent-step:nth-child(1) { animation-delay: 0.2s; }
        .agent-step:nth-child(2) { animation-delay: 0.7s; }
        .agent-step:nth-child(3) { animation-delay: 1.2s; }
        .agent-step:nth-child(4) { animation-delay: 1.7s; }
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ghostDash {
          0%   { border-color: rgba(160,120,255,0.2); }
          50%  { border-color: rgba(180,140,255,0.6); }
          100% { border-color: rgba(160,120,255,0.2); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-primary:hover { background: #e8e8e8 !important; transform: translateY(-2px); }
        .btn-secondary:hover { border-color: #444 !important; color: #fff !important; }
        .back-btn:hover { color: #fff !important; }
      `}</style>

      {/* Splash */}
      {!splashDone && (
        <div style={{
          position: 'fixed', inset: 0, background: '#141414',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 55, height: 55,
            border: '2px solid rgba(255,255,255,0.15)',
            borderTopColor: 'rgba(255,255,255,0.7)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      )}

      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#141414', color: '#e8e8e8', overflowX: 'hidden', minHeight: '100vh' }}>

        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 48px', borderBottom: '1px solid #1e1e1e',
          position: 'sticky', top: 0,
          background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', zIndex: 100,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff', fontSize: 18, fontWeight: 700 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image.png" alt="Helix" style={{ width: 28, height: 28, objectFit: 'contain', mixBlendMode: 'screen' }} />
            Helix
          </Link>
          <Link href="/" className="back-btn" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Chat
          </Link>
        </nav>

        {/* Hero */}
        <section style={{
          minHeight: '92vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '80px 40px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, color: '#fff', letterSpacing: -2, lineHeight: 1.05, marginBottom: 24, maxWidth: 800 }}>
            Helix on your desktop.<br /><span style={{ color: '#888' }}>Built for operators.</span>
          </h1>

          <p style={{ fontSize: 20, color: '#555', lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
            Native performance, deeper privacy, and full agent capabilities. No browser required.
          </p>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#" className="btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 36px', background: '#fff', color: '#000',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', textDecoration: 'none', transition: 'background 0.2s, transform 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {platformLabel}
            </a>
            <Link href="/" className="btn-secondary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '16px 28px', background: 'transparent', color: '#888',
              border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 15, fontWeight: 500,
              cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s',
            }}>
              Use in browser →
            </Link>
          </div>

          <div style={{ marginTop: 20, fontSize: 13, color: '#2e2e2e' }}>
            Version 1.0.0 · Free · {platformNote}
          </div>

          {/* Mock screenshot */}
          <div style={{
            marginTop: 64, width: '100%', maxWidth: 900,
            background: '#111', border: '1px solid #1e1e1e', borderRadius: 16,
            overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
          }}>
            <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <div style={{ padding: 32, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ w: '80%', bg: '#2a2a2a' }, { w: '75%', bg: '#1a1a1a' }, { w: '60%', bg: '#1a1a1a' }, { w: '75%', bg: '#1a1a1a' }, { w: '60%', bg: '#1a1a1a' }, { w: '100%', bg: '#1a1a1a' }, { w: '60%', bg: '#1a1a1a' }].map((item, i) => (
                  <div key={i} style={{ height: 14, borderRadius: 4, background: item.bg, width: item.w }} />
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ height: 48, borderRadius: 10, background: '#1a1a1a', width: '80%' }} />
                <div style={{ height: 48, borderRadius: 10, background: '#222', alignSelf: 'flex-end', width: '55%' }} />
                <div style={{ height: 48, borderRadius: 10, background: '#1a1a1a', width: '65%' }} />
                <div style={{ height: 48, borderRadius: 10, background: '#222', alignSelf: 'flex-end', width: '40%' }} />
                <div style={{ height: 52, borderRadius: 12, background: '#161616', border: '1px solid #222', marginTop: 8 }} />
              </div>
            </div>
          </div>
        </section>

        {/* Feature 1: Performance */}
        <section
          ref={el => { sectionsRef.current[0] = el }}
          className="dl-animate"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '100px 80px', borderTop: '1px solid #111' }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: -0.5, marginBottom: 20, lineHeight: 1.2 }}>
              Blazing fast.<br />No browser overhead.
            </h2>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
              Helix desktop runs natively on your machine. Responses render faster, the interface is smoother, and memory usage is significantly lower than any browser tab.
            </p>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8 }}>
              On high-end machines you'll notice it immediately. On lower-spec hardware, it's even more pronounced — the desktop app is optimized to run lean.
            </p>
          </div>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: 32, width: '100%' }}>
              {[
                { label: 'Helix Desktop', time: '~120ms', w: '88%', browser: false },
                { label: 'Browser tab', time: '~340ms', w: '38%', browser: true },
                { label: 'Startup time', time: '0.8s', w: '95%', browser: false },
              ].map((bar, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#444', marginBottom: 6 }}>
                    <span>{bar.label}</span><span>{bar.time}</span>
                  </div>
                  <div style={{ height: 8, background: '#1a1a1a', borderRadius: 4, marginBottom: 20, overflow: 'hidden' }}>
                    <div className={`dl-perf-fill${bar.browser ? ' browser' : ''}`} style={{ '--w': bar.w } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature 2: Ghost Mode */}
        <section
          ref={el => { sectionsRef.current[1] = el }}
          className="dl-animate"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '100px 80px', borderTop: '1px solid #111', direction: 'rtl' }}
        >
          <div style={{ direction: 'ltr' }}>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: -0.5, marginBottom: 20, lineHeight: 1.2 }}>
              Ghost Mode.<br />Deeper on desktop.
            </h2>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
              When you activate Ghost Mode on desktop, there is no browser history, no cookies, no cached data, and no OS-level session artifacts. The session exists only in memory.
            </p>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8 }}>
              Everything is wiped completely when you close it. No traces. No logs. Nothing left behind.
            </p>
          </div>
          <div style={{ direction: 'ltr', background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 20, border: '2px dashed rgba(160,120,255,0.3)', animation: 'ghostDash 4s linear infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(160,120,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3C8.13 3 5 6.13 5 10v8l2-2 2 2 2-2 2 2 2-2 2 2v-8c0-3.87-3.13-7-7-7z"/>
                <circle cx="9.5" cy="10.5" r="1" fill="rgba(160,120,255,0.6)"/>
                <circle cx="14.5" cy="10.5" r="1" fill="rgba(160,120,255,0.6)"/>
              </svg>
              <div style={{ fontSize: 13, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ghost Mode Active</div>
            </div>
          </div>
        </section>

        {/* Feature 3: Agent Mode */}
        <section
          ref={el => { sectionsRef.current[2] = el }}
          className="dl-animate"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '100px 80px', borderTop: '1px solid #111' }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: -0.5, marginBottom: 20, lineHeight: 1.2 }}>
              Agent Mode.<br />Fully autonomous.
            </h2>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
              Full autonomous agent capabilities are unlocked on desktop. Helix can run multi-step workflows — recon, enumeration, exploitation chains, and report generation — without you needing to intervene.
            </p>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8 }}>
              The desktop environment gives the agent access to local tools, scripts, and system resources that aren't available in a sandboxed browser context.
            </p>
          </div>
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: 28, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { dot: 'done', text: 'Scanning target network...' },
                { dot: 'done', text: 'Enumerating open ports' },
                { dot: 'active', text: 'Running exploit chain' },
                { dot: '', text: 'Generating report' },
              ].map((step, i) => (
                <div key={i} className="agent-step">
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: step.dot === 'active' ? '#fff' : step.dot === 'done' ? '#3a3a3a' : '#2a2a2a',
                    boxShadow: step.dot === 'active' ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
                  }} />
                  {step.text}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature 4: System Integration */}
        <section
          ref={el => { sectionsRef.current[3] = el }}
          className="dl-animate"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', padding: '100px 80px', borderTop: '1px solid #111', direction: 'rtl' }}
        >
          <div style={{ direction: 'ltr' }}>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: -0.5, marginBottom: 20, lineHeight: 1.2 }}>
              System integration.<br />Your command center.
            </h2>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, marginBottom: 16 }}>
              Run terminal commands, read and write files, and pipe output directly into the chat. Helix becomes a command center rather than just a chat interface.
            </p>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8 }}>
              Instead of switching windows between tools, you stay in Helix and let it orchestrate everything. One interface. Full control.
            </p>
          </div>
          <div style={{ direction: 'ltr', background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/10', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 32, flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#2a2a2a', fontFamily: 'monospace', marginBottom: 8 }}>TERMINAL</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3a3a3a', lineHeight: 2 }}>
              <div><span style={{ color: '#2a2a2a' }}>$</span> <span style={{ color: '#444' }}>nmap -sV 192.168.1.0/24</span></div>
              <div><span style={{ color: '#2a2a2a' }}>$</span> <span style={{ color: '#444' }}>helix analyze --file report.txt</span></div>
              <div><span style={{ color: '#2a2a2a' }}>$</span> <span style={{ color: '#444' }}>helix exploit --target 192.168.1.5</span></div>
              <div style={{ color: '#333' }}>▌</div>
            </div>
          </div>
        </section>

        {/* System Requirements */}
        <section
          ref={el => { sectionsRef.current[4] = el }}
          className="dl-animate"
          style={{ padding: 80, borderTop: '1px solid #111' }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 40 }}>System requirements</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: 16, overflow: 'hidden' }}>
            {[
              { label: 'Windows', value: 'Windows 10 / 11 (64-bit)' },
              { label: 'macOS', value: 'macOS 12 Monterey or later' },
              { label: 'Linux', value: 'Ubuntu 20.04+ / Debian 11+' },
              { label: 'Processor', value: 'x64 or ARM64' },
              { label: 'Memory', value: '4 GB RAM minimum' },
              { label: 'Storage', value: '500 MB available space' },
            ].map((spec, i) => (
              <div key={i} style={{ background: '#0d0d0d', padding: '28px 32px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#333', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{spec.label}</div>
                <div style={{ fontSize: 16, color: '#888', fontWeight: 500 }}>{spec.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '100px 40px', borderTop: '1px solid #111' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 16 }}>Ready to go deeper?</h2>
          <p style={{ fontSize: 18, color: '#444', marginBottom: 40 }}>Download Helix and take your operations to the next level.</p>
          <a href="#" className="btn-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 36px', background: '#fff', color: '#000',
            border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', textDecoration: 'none', transition: 'background 0.2s, transform 0.15s',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Free
          </a>
        </section>

      </div>
    </>
  )
}
