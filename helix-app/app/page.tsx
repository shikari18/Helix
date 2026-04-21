'use client'

import { useEffect, useState } from 'react'
import ChatApp from './components/ChatApp'
import PageSplash from './components/PageSplash'

export default function Home() {
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {!splashDone && <PageSplash />}
      <ChatApp />
    </>
  )
}
