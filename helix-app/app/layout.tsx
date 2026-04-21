import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Helix',
  description: 'Helix AI — Pentesting & Hacking AI',
  icons: { icon: '/image.png' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
