'use client'

import { useState } from 'react'
import Link from 'next/link'

const PRICES = {
  monthly: { pro: 9, proPlus: 40, ultra: 200 },
  yearly:  { pro: 15, proPlus: 33, ultra: 166 },
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 6, width: 28, height: 28 }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const p = PRICES[billing]

  const currentPlan = typeof window !== 'undefined' ? localStorage.getItem('helix_plan') : null

  const PlanButton = ({ planId, label }: { planId: string, label: string }) => {
    const isCurrent = currentPlan === planId
    return (
      <button 
        disabled={isCurrent}
        className={isCurrent ? "" : "plan-btn-outline"}
        onClick={() => {
          localStorage.setItem('helix_plan', planId)
          window.location.href = '/'
        }} 
        style={{ 
          width: '100%', 
          padding: 14, 
          borderRadius: 12, 
          fontSize: 15, 
          fontWeight: 700, 
          fontFamily: 'inherit', 
          cursor: isCurrent ? 'default' : 'pointer', 
          transition: 'all 0.2s', 
          marginBottom: 26, 
          background: isCurrent ? '#222' : 'transparent', 
          border: isCurrent ? '1px solid #444' : '1px solid #3a3a3a', 
          color: isCurrent ? '#666' : '#fff' 
        }}
      >
        {isCurrent ? 'Current Plan' : label}
      </button>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-120px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        body { overflow: auto !important; display: block !important; padding: 0 !important; background: #0d0d0d !important; }
        .plan-btn-outline:hover { border-color: #888 !important; background: rgba(255,255,255,0.05) !important; }
        .close-btn:hover { color: #fff !important; }
        .toggle-btn { padding: 8px 20px; border-radius: 20px; border: none; background: transparent; color: #808080; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .toggle-btn.active { background: #2d2d2d; color: #fff; }
        .card-anim:nth-child(1) { animation: slideDown 0.5s 0s ease forwards; }
        .card-anim:nth-child(2) { animation: slideDown 0.5s 0.15s ease forwards; }
        .card-anim:nth-child(3) { animation: slideDown 0.5s 0.3s ease forwards; }
        @media (max-width: 900px) {
          .cards-wrapper { grid-template-columns: 1fr !important; padding-bottom: 60px; }
        }
      `}</style>

      {/* Top light */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '55vh', background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Close button */}
      <Link href="/" className="close-btn" style={{ position: 'fixed', top: 24, right: 24, background: 'transparent', border: 'none', color: '#444', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', zIndex: 100, textDecoration: 'none', lineHeight: 1 }}>✕</Link>
      <div style={{ fontFamily: "Inter, -apple-system, system-ui, sans-serif", background: '#0d0d0d', color: '#fff', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px 80px' }}>

        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 24, letterSpacing: -1 }}>Upgrade your plan</h1>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#161616', border: '1px solid #222', borderRadius: 24, padding: 4, marginBottom: 40 }}>
          <button className={`toggle-btn${billing === 'monthly' ? ' active' : ''}`} onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={`toggle-btn${billing === 'yearly' ? ' active' : ''}`} onClick={() => setBilling('yearly')}>
            Yearly <span style={{ fontSize: 11, fontWeight: 700, color: '#5a5aff' }}>–17%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="cards-wrapper" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100 }}>

          {/* PRO */}
          <div className="card-anim" style={{ opacity: 0, padding: '40px 32px', display: 'flex', flexDirection: 'column', border: '1px solid #222', borderRadius: 28, background: '#111' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#444' }}>$</span>
              <span style={{ fontSize: 64, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.pro}</span>
              <span style={{ fontSize: 14, color: '#444' }}>/ {billing === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 1.5 }}>Essential tools for daily operations and personal growth.</div>
            <PlanButton planId="pro" label="Get Pro" />
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {['Extended daily usage limits', 'Practice mode access', 'Group collaboration', '2 image uploads per week'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500, color: '#999' }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

          {/* PRO+ */}
          <div className="card-anim" style={{ opacity: 0, padding: '40px 32px', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid #333', borderRadius: 28, background: '#161616', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#5a5aff', color: '#fff', fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>Most Popular</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Pro+</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#444' }}>$</span>
              <span style={{ fontSize: 64, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.proPlus}</span>
              <span style={{ fontSize: 14, color: '#444' }}>/ {billing === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 1.5 }}>Advanced capabilities for researchers and professionals.</div>
            <PlanButton planId="proplus" label="Get Pro+" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Everything in Pro, plus:</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {['Agent mode with daily refresh', '10 image uploads per week', 'Priority task execution'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500, color: '#999' }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

          {/* ULTRA */}
          <div className="card-anim" style={{ opacity: 0, padding: '40px 32px', display: 'flex', flexDirection: 'column', border: '1px solid #222', borderRadius: 28, background: '#111' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Ultra</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#444' }}>$</span>
              <span style={{ fontSize: 64, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{p.ultra}</span>
              <span style={{ fontSize: 14, color: '#444' }}>/ {billing === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 1.5 }}>Unlimited power for elite operators and power users.</div>
            <PlanButton planId="ultra" label="Get Ultra" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Everything in Pro+, plus:</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {['Unlimited usage across all features', 'Exclusive early access to updates', 'Premium support channel'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500, color: '#999' }}><CheckIcon />{f}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Mobile Notice */}
        <div style={{ marginTop: 60, padding: '24px 32px', background: '#161616', border: '1px solid #222', borderRadius: 20, maxWidth: 700, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            <strong style={{ color: '#888' }}>Platform Note:</strong> Practice mode and Agent mode are desktop-exclusive. 
            Mobile subscriptions will unlock these features when accessed via desktop. 
            Chat features are fully cross-platform.
          </div>
        </div>
      </div>
    </>
  )
}
