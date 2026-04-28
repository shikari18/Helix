'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Shield, MessageSquare, Users, CreditCard, Activity, MessageCircle } from 'lucide-react'

const NAV = [
  { label: 'Overview', icon: Shield, href: '/admin' },
  { label: 'Messaging', icon: MessageSquare, href: '/admin/messaging' },
  { label: 'Accounts', icon: Users, href: '/admin/accounts' },
  { label: 'Plan Management', icon: CreditCard, href: '/admin/plans' },
  { label: 'Live Activity', icon: Activity, href: '/admin/activity' },
  { label: 'Feedback', icon: MessageCircle, href: '/admin/feedback' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    sessionStorage.removeItem('helix_admin_auth')
    router.push('/admin/login')
  }

  return (
    <aside style={{
      width: 200, background: '#0d0d0d', borderRight: '1px solid #1f1f1f',
      display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1f1f1f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#1a3a6b', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#60a5fa'
          }}>H</div>
          <span style={{ color: '#f3f4f6', fontSize: 14, fontWeight: 700 }}>CoreAdmin</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? '#1a2a4a' : 'transparent',
                color: active ? '#60a5fa' : '#9ca3af',
                fontSize: 13, fontWeight: active ? 600 : 400,
                marginBottom: 2, textAlign: 'left', transition: 'all 0.15s'
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #1f1f1f' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none',
          background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer',
          textAlign: 'left'
        }}>Sign out</button>
      </div>
    </aside>
  )
}
