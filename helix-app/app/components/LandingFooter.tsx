'use client'

export default function LandingFooter() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      textAlign: 'center',
      fontSize: 13,
      color: '#555',
      pointerEvents: 'none',
    }}>
      By messaging Helix, you agree to our{' '}
      <a href="/terms-of-service" style={{ color: '#888', textDecoration: 'underline', pointerEvents: 'all' }}>Terms of Service</a>
      {' '}and have read our{' '}
      <a href="/privacy-policy" style={{ color: '#888', textDecoration: 'underline', pointerEvents: 'all' }}>Privacy Policy</a>.
    </div>
  )
}
