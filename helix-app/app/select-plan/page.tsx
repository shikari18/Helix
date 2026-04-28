'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Star, Shield, Check, ArrowRight } from 'lucide-react'

export default function PlanSelection() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const PLANS = [
    { id: 'pro', name: 'PRO', price: '29', features: ['Core AI Access', 'Standard Throughput', '24/7 Support'], color: '#60a5fa' },
    { id: 'proplus', name: 'PRO+', price: '59', features: ['Advanced Nexus AI', 'High Priority Nodes', 'Custom Agents'], color: '#a78bfa' },
    { id: 'ultra', name: 'ULTRA', price: '199', features: ['Singularity Access', 'Unlimited Throughput', 'Neural Priority'], color: '#fbbf24' },
  ]

  const handleSelect = async (planId: string) => {
    const email = localStorage.getItem('helix_user_email')
    if (!email) { router.push('/signup'); return }
    
    setLoading(planId)
    try {
      await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: planId })
      })
      // Mark that they've chosen
      localStorage.setItem(`helix_plan_chosen_${email}`, 'true')
      router.push('/')
    } catch (e) {
      alert('Selection failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '80px 20px' }}>
      <style>{`
        .plan-card { background: #111; border: 1px solid #1a1a1a; border-radius: 24px; padding: 40px; transition: 0.3s; cursor: pointer; display: flex; flex-direction: column; height: 100%; position: relative; }
        .plan-card:hover { border-color: #333; transform: translateY(-8px); background: #141414; }
        .plan-card.active { border-color: #fff; }
        .btn-select { width: 100%; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; margin-top: auto; transition: 0.2s; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.04em' }}>INITIALIZE_TIER</h1>
        <p style={{ color: '#444', fontSize: 18, marginBottom: 60 }}>Select your access level to synchronize with the HELIX core.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className="plan-card" onClick={() => handleSelect(plan.id)}>
              <div style={{ marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  {plan.id === 'pro' && <Zap size={24} color={plan.color} />}
                  {plan.id === 'proplus' && <Star size={24} color={plan.color} />}
                  {plan.id === 'ultra' && <Shield size={24} color={plan.color} />}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>{plan.name}</h2>
                <div style={{ fontSize: 42, fontWeight: 900 }}>${plan.price}<span style={{ fontSize: 16, color: '#444', fontWeight: 500 }}>/mo</span></div>
              </div>

              <div style={{ textAlign: 'left', marginBottom: 40 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: '#888' }}>
                    <Check size={14} color="#4ade80" /> {f}
                  </div>
                ))}
              </div>

              <button 
                className="btn-select"
                style={{ background: loading === plan.id ? '#1a1a1a' : '#fff', color: loading === plan.id ? '#444' : '#000' }}
              >
                {loading === plan.id ? 'SYNCHRONIZING...' : 'SELECT_TIER'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
