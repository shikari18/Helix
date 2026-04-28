'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegistryGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const email = localStorage.getItem('helix_user_email')
    const loggedIn = localStorage.getItem('helix_logged_in')

    if (window.location.pathname.startsWith('/admin')) {
      setChecking(false)
      return
    }

    let lastHeartbeat = 0
    const check = () => {
      if (loggedIn === 'true' && email) {
        checkStatus(email)
        
        // Heartbeat every 30s
        const now = Date.now()
        if (now - lastHeartbeat > 30000) {
          fetch('http://localhost:8000/api/auth/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          }).catch(() => {})
          lastHeartbeat = now
        }
      } else {
        setChecking(false)
      }
    }

    check()
    const interval = setInterval(check, 2000)
    return () => clearInterval(interval)
  }, [router])

  async function checkStatus(email: string) {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      const users = data.users || []
      
      const user = users.find((u: any) => u.email === email)
      
      // If user not found in registry OR they are explicitly blocked
      if (!user || user.blocked) {
        localStorage.removeItem('helix_logged_in')
        localStorage.removeItem('helix_user_email')
        router.push('/signup?logout=true&unauthorized=true')
        return
      }
    } catch (e) {
      console.error('Registry check failed', e)
    } finally {
      setChecking(false)
    }
  }

  if (checking) {
    return (
      <div style={{ fixed: 'inset-0', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ width: 30, height: 30, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return <>{children}</>
}
