'use client'

import Link from 'next/link'

export default function CancelPlanPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '0 20px', overflowY: 'auto' }}>
      <style>{`
        body { background: #0a0a0a !important; margin: 0; }
        .doc-section { margin-bottom: 48px; }
        .doc-title { font-size: 32px; font-weight: 800; margin-bottom: 24px; color: #fff; letter-spacing: -0.02em; }
        .doc-text { font-size: 16px; color: #888; line-height: 1.7; margin-bottom: 20px; }
        .doc-highlight { color: #5a5aff; font-weight: 600; }
        .back-link:hover { color: #fff !important; }
        .danger-zone { border: 1px solid #331111; background: #1a0a0a; border-radius: 16px; padding: 32px; margin-top: 60px; }
      `}</style>

      <nav style={{ maxWidth: 800, margin: '0 auto', padding: '40px 0', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
          <img src="/image.png" alt="" style={{ width: 24, height: 24, mixBlendMode: 'screen' }} />
          Subscription Management
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: '40px auto', paddingBottom: 100 }}>
        <div className="doc-section">
          <h1 className="doc-title">Plan Cancellation Policy</h1>
          <p className="doc-text">
            We understand that your needs may change. This document outlines the technical and financial implications of cancelling your Helix subscription. Please read this carefully before proceeding.
          </p>
        </div>

        <div className="doc-section">
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>No Refund Policy</h2>
          <p className="doc-text">
            All Helix subscriptions are <span className="doc-highlight">non-refundable</span>. Upon initiating a cancellation, you will not receive a pro-rated refund for the remaining time in your current billing cycle. 
          </p>
          <p className="doc-text">
            By cancelling, you are opting out of future renewals only. You will retain full access to all premium features (including Agent Mode and increased upload limits) until the exact microsecond your current period expires.
          </p>
        </div>

        <div className="doc-section">
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>Auto-Renewal Termination</h2>
          <p className="doc-text">
            The primary effect of cancellation is the immediate <span className="doc-highlight">deactivation of our automated billing system</span>. We will no longer attempt to deduct funds from your account at the start of the next month or year (depending on your selected cycle).
          </p>
        </div>

        <div className="doc-section">
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>Expiration & Account Lockdown</h2>
          <p className="doc-text">
            When your current paid term ends:
            <ul style={{ marginTop: 12, paddingLeft: 20 }}>
              <li style={{ marginBottom: 12 }}>You will be <span className="doc-highlight">automatically logged out</span> of all Helix sessions across all devices (Desktop and Web).</li>
              <li style={{ marginBottom: 12 }}>Your access to Agent Mode will be revoked immediately.</li>
              <li style={{ marginBottom: 12 }}>You will be redirected to the plan selection page upon your next visit, where you must choose a new tier to resume interaction with Helix.</li>
            </ul>
          </p>
        </div>

        <div className="danger-zone">
          <h2 style={{ color: '#ff4d4d', fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>Confirm Termination</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            By clicking below, you acknowledge that you have read and understood the non-refund policy and the automatic logout procedure upon expiry.
          </p>
          <button 
            onClick={() => {
              alert("Auto-renewal has been disabled. Your plan remains active until the end of the term.")
              window.close()
            }}
            style={{ 
              background: '#ff4d4d', border: 'none', color: '#fff', 
              padding: '12px 24px', borderRadius: 8, fontWeight: 700, 
              cursor: 'pointer', transition: 'all 0.2s' 
            }}
            onMouseOver={e => e.currentTarget.style.background = '#ff3333'}
            onMouseOut={e => e.currentTarget.style.background = '#ff4d4d'}
          >
            Disable Auto-Renewal
          </button>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/" style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>Return to Dashboard</Link>
        </div>
      </main>
    </div>
  )
}
