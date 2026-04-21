import '../globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learn Hacking — Helix',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#141414', overflowY: 'auto', display: 'block' }}>
        {children}
      </body>
    </html>
  )
}
