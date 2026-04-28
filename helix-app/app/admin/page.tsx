'use client'
import { useState, useEffect } from 'react'
import { 
  Users, Activity, Zap, ShieldAlert, 
  MessageSquare, Terminal, Server, Globe,
  LayoutGrid, Settings, LogOut, BarChart3,
  Cpu, Database, Globe2, Bell, Search,
  Power, RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from './components/useAdminAuth'
import AdminHeader from './components/AdminHeader'

export default function AdminBento() {
  useAdminAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        setUsers(d.users || [])
        setLoading(false)
      })
  }, [])

  const stats = {
    total: users.length,
    ultra: users.filter(u => u.plan === 'ultra').length,
    pro: users.filter(u => u.plan === 'pro' || !u.plan || u.plan === 'free').length,
    blocked: users.filter(u => u.blocked).length
  }

  const BENTO_CARDS = [
    { id: 'users', title: 'User Management', icon: Users, color: '#fff', size: 'large', data: `${stats.total} Total Entities`, path: '/admin/accounts' },
    { id: 'traffic', title: 'Ultra Singularity', icon: Activity, color: '#fbbf24', size: 'small', data: `${stats.ultra} Nodes`, path: '/admin/accounts' },
    { id: 'system', title: 'Pro Tier', icon: Cpu, color: '#60a5fa', size: 'small', data: `${stats.pro} Nodes`, path: '/admin/accounts' },
    { id: 'revenue', title: 'Revenue Stream', icon: BarChart3, color: '#fff', size: 'medium', data: `$${(stats.pro * 29) + (stats.ultra * 199)}/mo`, path: '/admin/plans' },
    { id: 'security', title: 'Security Alerts', icon: ShieldAlert, color: stats.blocked > 0 ? '#f87171' : '#fff', size: 'medium', data: `${stats.blocked} Revoked`, path: '/admin/accounts' },
    { id: 'database', title: 'DB Clusters', icon: Database, color: '#fff', size: 'small', data: 'Healthy', path: '/admin/activity' },
    { id: 'messages', title: 'AI Throughput', icon: MessageSquare, color: '#fff', size: 'large', data: '85k tokens/s', path: '/admin/messaging' },
  ]

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: 40, boxSizing: 'border-box', overflowY: 'auto' }}>
      <AdminHeader />

      <style>{`
        html, body { overflow: auto !important; height: auto !important; }
        @keyframes bentoIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .bento-card {
          background: #111; border: 1px solid #1a1a1a; border-radius: 20px;
          padding: 24px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer; position: relative; overflow: hidden;
          animation: bentoIn 0.6s ease both;
        }
        .bento-card:hover { border-color: #333; transform: scale(1.02); background: #161616; }
        .bento-card:hover .icon-box { background: #fff; color: #000; }
        .icon-box {
          width: 40px; height: 40px; border-radius: 10px; background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px; transition: all 0.3s;
        }
        .grid-container {
          display: grid; grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 200px; gap: 20px; max-width: 1400px; margin: 0 auto;
        }
        .large { grid-column: span 2; grid-row: span 2; }
        .medium { grid-column: span 2; }
        .small { grid-column: span 1; }
      `}</style>

      {/* --- Main Dashboard Stats --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, maxWidth: 1400, margin: '0 auto 40px' }}>
         <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 24 }}>
           <div style={{ fontSize: 11, color: '#444', fontWeight: 800, marginBottom: 12 }}>GLOBAL_NODES</div>
           <div style={{ fontSize: 28, fontWeight: 800 }}>{loading ? '...' : stats.total}</div>
         </div>
         <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 24 }}>
           <div style={{ fontSize: 11, color: '#444', fontWeight: 800, marginBottom: 12 }}>SYSTEM_LATENCY</div>
           <div style={{ fontSize: 28, fontWeight: 800 }}>12ms</div>
         </div>
         <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 24 }}>
           <div style={{ fontSize: 11, color: '#444', fontWeight: 800, marginBottom: 12 }}>API_REQUESTS</div>
           <div style={{ fontSize: 28, fontWeight: 800 }}>{loading ? '...' : (stats.total * 42).toLocaleString()}</div>
         </div>
         <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 24 }}>
           <div style={{ fontSize: 11, color: '#444', fontWeight: 800, marginBottom: 12 }}>UPTIME_OS</div>
           <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>99.99%</div>
         </div>
      </div>

      {/* --- Bento Grid --- */}
      <div className="grid-container">
        {BENTO_CARDS.map((card, idx) => (
          <div key={card.id} className={`bento-card ${card.size}`} style={{ animationDelay: `${idx * 0.05}s` }} onClick={() => router.push(card.path)}>
            <div className="icon-box">
              <card.icon size={20} color={card.color} />
            </div>
            <div style={{ fontSize: 13, color: '#444', fontWeight: 800, marginBottom: 4 }}>{card.title.toUpperCase()}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{card.data}</div>
            
            {card.id === 'security' && (
              <div style={{ position: 'absolute', top: 20, right: 20, width: 8, height: 8, background: '#f87171', borderRadius: '50%', boxShadow: '0 0 10px #f87171' }} />
            )}
          </div>
        ))}

        {/* Maintenance Toggle */}
        <div className="bento-card small" style={{ background: maintenance ? '#1a1111' : '#111', borderColor: maintenance ? '#451a1a' : '#1a1a1a' }}>
           <div className="icon-box" style={{ background: maintenance ? '#f87171' : '#1a1a1a' }}>
             <Power size={20} color={maintenance ? '#000' : '#fff'} />
           </div>
           <div style={{ fontSize: 11, color: '#444', fontWeight: 800, marginBottom: 12 }}>MAINTENANCE_MODE</div>
           <button 
            onClick={(e) => { e.stopPropagation(); setMaintenance(!maintenance) }}
            style={{ 
              background: maintenance ? '#f87171' : '#1a1a1a', 
              color: maintenance ? '#000' : '#fff', 
              border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer' 
            }}
           >
             {maintenance ? 'DEACTIVATE' : 'ACTIVATE_PROTOCOL'}
           </button>
        </div>
      </div>
    </div>
  )
}
