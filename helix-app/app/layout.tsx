import type { Metadata } from 'next'
import './globals.css'
import PWAInstaller from './components/PWAInstaller'

export const metadata: Metadata = {
  title: 'Helix',
  description: 'Helix AI — Pentesting & Hacking AI',
  icons: { 
    icon: '/image.png',
    apple: '/image.png'
  },
  manifest: '/manifest.json',
  themeColor: '#141414',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Helix AI',
  },
}

import RegistryGuard from './components/RegistryGuard'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Helix AI" />
        <link rel="apple-touch-icon" href="/image.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <RegistryGuard>
          <PWAInstaller />
          {children}
        </RegistryGuard>
      </body>
    </html>
  )
}
