'use client'
import { useState, useEffect } from 'react'
import { 
  CreditCard, Zap, Star, Award, 
  TrendingUp, ArrowLeft, Search, Check,
  ChevronRight, DollarSign, Package
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../components/useAdminAuth'
import AdminHeader from '../components/AdminHeader'

interface User { email: string; name: string; plan: string; blocked: boolean; signedUpAt: string; lastActiveAt: string }

export default function AdminPlans() {
  useAdminAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } finally { setLoading(false) }
  }

  const PLANS = [
    { id: 'pro', name: 'Pro Dispatch', price: '$29', users: users.filter(u => u.plan === 'pro' || !u.plan || u.plan === 'free').length, color: '#60a5fa' },
    { id: 'proplus', name: 'Pro+ Nexus', price: '$59', users: users.filter(u => u.plan === 'proplus').length, color: '#a78bfa' },
    { id: 'ultra', name: 'Ultra Singularity', price: '$199', users: users.filter(u => u.plan === 'ultra').length, color: '#fbbf24' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <AdminHeader />

      <style>{`
        .plan-card {
          background: #111; border: 1px solid #1a1a1a; border-radius: 20px;
          padding: 30px; transition: all 0.2s; position: relative;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .plan-card:hover { border-color: #333; transform: translateY(-4px); background: #141414; }
        .progress-bar { height: 4px; background: #1a1a1a; borderRadius: 2px; width: 100%; position: relative; margin-top: 20px; }
        .progress-fill { height: 100%; background: #fff; borderRadius: 2px; transition: width 0.5s; }
      `}</style>

      {/* Plan Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40, maxWidth: 1400, margin: '0 auto 40px' }}>
        {PLANS.map(plan => (
          <div key={plan.id} className="plan-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} color={plan.color} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{plan.price}<span style={{ fontSize: 12, color: '#444', fontWeight: 500 }}>/mo</span></div>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{plan.name}</h3>
              <p style={{ color: '#444', fontSize: 12, lineHeight: 1.5 }}>
                Optimized throughput and singularity access for elite entities.
              </p>
            </div>

            <div style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#666' }}>
                <span>{plan.users} ENTITIES</span>
                <span>{Math.round((plan.users / users.length) * 100 || 0)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(plan.users / users.length) * 100}%`, background: plan.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Section */}
      <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 30, maxWidth: 1400, margin: '0 auto' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
           <DollarSign size={18} color="#4ade80" />
           <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>FINANCIAL_TELEMETRY</h2>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
           <div>
             <div style={{ fontSize: 11, color: '#444', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>MONTHLY_REVENUE</div>
             <div style={{ fontSize: 24, fontWeight: 800 }}>$14,240.00</div>
           </div>
           <div>
             <div style={{ fontSize: 11, color: '#444', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>CHURN_RATE</div>
             <div style={{ fontSize: 24, fontWeight: 800 }}>1.2%</div>
           </div>
           <div>
             <div style={{ fontSize: 11, color: '#444', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>AVG_LTV</div>
             <div style={{ fontSize: 24, fontWeight: 800 }}>$412.00</div>
           </div>
         </div>
      </div>
    </div>
  )
}
