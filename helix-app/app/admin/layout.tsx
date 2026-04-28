import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Helix Admin',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        html, body { 
          width: 100%; 
          margin: 0;
          padding: 0;
        }
      `}</style>
      {children}
    </div>
  )
}
