'use client'

interface Props {
  onSignIn: () => void
}

export default function LandingNavbar({ onSignIn }: Props) {
  return (
    <nav style={{
      position: 'fixed', top: 11, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56, zIndex: 100,
      background: 'transparent',
    }}>
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff', fontSize: 18, fontWeight: 700 }}>
        <img src="/image.png" alt="Helix" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        Helix
      </a>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, flex: 1, justifyContent: 'center' }}>
        {['About Helix', 'Platform', 'Solutions', 'Pricing', 'Resources'].map(item => (
          <a key={item} href="#" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 600, color: '#fff', textDecoration: 'none', transition: 'opacity 0.2s' }}>
            {item}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="/download" style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
          borderRadius: 20, border: '1px solid #333', background: 'transparent',
          color: '#ccc', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </a>
        <button
          onClick={onSignIn}
          style={{
            padding: '8px 20px', borderRadius: 20, border: '1px solid #fff',
            background: '#fff', color: '#000', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          Sign in
        </button>
      </div>
    </nav>
  )
}
