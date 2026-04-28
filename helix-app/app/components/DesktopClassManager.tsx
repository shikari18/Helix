'use client'

import { useEffect } from 'react'

export default function DesktopClassManager() {
  useEffect(() => {
    const isDesktop = (window as any).helixDesktop?.isDesktop || navigator.userAgent.includes('HelixDesktop')
    if (isDesktop) {
      document.body.classList.add('is-desktop')
    }
  }, [])

  return null
}
