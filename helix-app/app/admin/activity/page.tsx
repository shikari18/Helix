'use client'
import { useState, useEffect } from 'react'
import { 
  Activity, ShieldAlert, Terminal, 
  Server, Globe, Database, Cpu,
  RefreshCw, Clock, Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../components/useAdminAuth'
import AdminHeader from '../components/AdminHeader'

export default function AdminActivity() {
  useAdminAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate real-time logs
    const mockLogs = [
      { id: 1, type: 'AUTH', status: 'SUCCESS', user: 'admin@helix.ai', ip: '192.168.1.1', time: '12:44:20' },
      { id: 2, type: 'API', status: 'WARNING', user: 'guest_node_42', ip: '45.12.98.3', time: '12:43:15' },
      { id: 3, type: 'SYSTEM', status: 'INFO', user: 'SYSTEM_CORE', ip: 'localhost', time: '12:40:01' },
      { id: 4, type: 'AUTH', status: 'FAILURE', user: 'unknown_entity', ip: '88.1.2.4', time: '12:38:55' },
    ]
    setLogs(mockLogs)
    setLoading(false)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', padding: 40, fontFamily: 'Inter, sans-serif' }}>
      <AdminHeader />

      <style>{`
        .log-row { border-bottom: 1px solid #1a1a1a; padding: 16px 0; display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
        .log-row:hover { background: rgba(255,255,255,0.02); }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; fontWeight: 800; letter-spacing: 0.05em; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 30, maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Left Side: Real-time Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Cpu size={18} color="#fff" />
              <div style={{ fontSize: 14, fontWeight: 700 }}>CORE_TELEMETRY</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: '#444', marginBottom: 6 }}>CPU_USAGE</div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: '14%', background: '#fff', borderRadius: 2 }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#444', marginBottom: 6 }}>MEM_ALLOCATION</div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: '62%', background: '#60a5fa', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Log Stream */}
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <Terminal size={18} />
               <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>SYSTEM_AUDIT_LOG</h2>
             </div>
             <button style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#666', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
               EXPORT_CSV
             </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map(log => (
              <div key={log.id} className="log-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ color: '#444', width: 60 }}>{log.time}</div>
                  <div className="badge" style={{ background: log.status === 'SUCCESS' ? 'rgba(74,222,128,0.1)' : log.status === 'FAILURE' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)', color: log.status === 'SUCCESS' ? '#4ade80' : log.status === 'FAILURE' ? '#f87171' : '#fbbf24' }}>
                    {log.type}
                  </div>
                  <div style={{ fontWeight: 600 }}>{log.user}</div>
                </div>
                <div style={{ color: '#444', fontFamily: 'monospace' }}>{log.ip}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
