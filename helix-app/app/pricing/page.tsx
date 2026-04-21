'use client'

import { useState } from 'react'
import Link from 'next/link'

const PRICES = {
  monthly: { pro: 25, proPlus: 60, ultra: 200 },
  yearly:  { pro: 21, proPlus: 50, ultra: 166 },
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 6, width: 28, height: 28 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const p = PRICES[billing]

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-120px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        body { overflow: auto !important; display: block !important; padding: 0 !important; }
        .plan-btn-outline:hover { border-color: #888 !important; }
        .plan-btn-primary:hover { background: #4a4aee !important; }
        .close-btn:hover { color: #fff !important; }
        .toggle-btn { padding: 6px 18px; border-radius: 20px; border: none; background: transparent; color: #808080; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .toggle-btn.active { background: #2d2d2d; color: #fff; }
        .card-anim:nth-child(1) { animation: slideDown 0.5s 0s ease forwards; }
        .card-anim:nth-child(2) { animation: slideDown 0.5s 0.15s ease forwards; }
        .card-anim:nth-child(3) { animation: slideDown 0.5s 0.3s ease forwards; }
        .card-anim:nth-child(4) { animation: slideDown 0.5s 0.45s ease forwards; }
        @media (max-width: 900px) {
          .cards-wrapper { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .cards-wrapper { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Top light */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '55vh', background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Close button */}
      <Link href="/" className="close-btn" style={{ position: 'fixed', top: 18, right: 18, background: 'transparent', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', zIndex: 100, textDecoration: 'none', lineHeight: 1 }}>✕</Link>
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px 24px' }}>

        <h1 style={{ fontSize: 32, fontWeight: 600, color: '#fff', marginBottom: 20, letterSpacing: -0.3 }}>Upgrade your plan</h1>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 24, padding: 3, marginBottom: 28, gap: 2 }}>
          <button className={`toggle-btn${billing === 'monthly' ? ' active' : ''}`} onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={`toggle-btn${billing === 'yearly' ? ' active' : ''}`} onClick={() => setBilling('yearly')}>
            Yearly <span style={{ fontSize: 11, fontWeight: 600, color: '#7c6af7' }}>Save 17%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="cards-wrapper" style={{ width: '100%', flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>

          {/* FREE */}
          <div className="card-anim" style={{ opacity: 0, padding: '36px 30px', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #2a2a2a', borderRadius: 24, background: '#111' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Free</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 8 }}>$</span>
              <span style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1 }}>0</span>
              <span style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#666', lineHeight: 1.4, alignSelf: 'flex-end', marginBottom: 6, marginLeft: 5 }}><span>USD /</span><span>month</span></span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 22 }}>Try Helix</div>
            <div style={{ textAlign: 'center', fontSize: 14, color: '#444', marginBottom: 26, padding: 13, border: '1px solid #222', borderRadius: 12 }}>Your current plan</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, paddingTop: 20 }}>
              {['Limited responses', 'Basic pentesting assistance', 'Agent mode with local sandbox'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 20, fontWeight: 500, color: '#bbb', lineHeight: 1.4 }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className="card-anim" style={{ opacity: 0, padding: '36px 30px', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #2a2a2a', borderRadius: 24, background: '#111' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 8 }}>$</span>
              <span style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.pro}</span>
              <span style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#666', lineHeight: 1.4, alignSelf: 'flex-end', marginBottom: 6, marginLeft: 5 }}><span>USD /</span><span>month</span></span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 22 }}>For everyday pentesting</div>
            <button className="plan-btn-outline" style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 26, background: 'transparent', border: '1px solid #3a3a3a', color: '#fff' }}>Get Pro</button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Everything in Free, plus:</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, paddingTop: 20 }}>
              {['Extended usage limits', 'File uploads', 'Cloud agents', 'Advanced recon tools', 'Maximum context window'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 20, fontWeight: 500, color: '#bbb', lineHeight: 1.4 }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

          {/* PRO+ */}
          <div className="card-anim" style={{ opacity: 0, padding: '36px 30px', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #444', borderRadius: 24, background: '#1e1e1e' }}>
            <span style={{ position: 'absolute', top: 22, right: 18, background: '#5a5aff', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>Recommended</span>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Pro+</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 8 }}>$</span>
              <span style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.proPlus}</span>
              <span style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#666', lineHeight: 1.4, alignSelf: 'flex-end', marginBottom: 6, marginLeft: 5 }}><span>USD /</span><span>month</span></span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 22 }}>For power users who need more</div>
            <button className="plan-btn-outline" style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 26, background: 'transparent', border: '1px solid #3a3a3a', color: '#fff' }}>Get Pro+</button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Everything in Pro, plus:</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, paddingTop: 20 }}>
              {['3x more usage than Pro', 'Priority response speed', 'Early access to new features'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 20, fontWeight: 500, color: '#bbb', lineHeight: 1.4 }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

          {/* ULTRA */}
          <div className="card-anim" style={{ opacity: 0, padding: '36px 30px', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #2a2a2a', borderRadius: 24, background: '#111' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Ultra</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 1, marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 8 }}>$</span>
              <span style={{ fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.ultra}</span>
              <span style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: '#666', lineHeight: 1.4, alignSelf: 'flex-end', marginBottom: 6, marginLeft: 5 }}><span>USD /</span><span>month</span></span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#888', marginBottom: 22 }}>Get the most out of Helix</div>
            <button className="plan-btn-outline" style={{ width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 26, background: 'transparent', border: '1px solid #3a3a3a', color: '#fff' }}>Get Ultra</button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Everything in Pro, plus:</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, paddingTop: 20 }}>
              {['10x more usage than Pro', 'Priority access to new features', 'Dedicated support'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 20, fontWeight: 500, color: '#bbb', lineHeight: 1.4 }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </>
  )
}
