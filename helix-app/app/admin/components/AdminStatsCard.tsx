import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBg?: string
  subtext?: string
}

export function StatsCard({ title, value, icon, iconBg = '#1a2a4a', subtext }: StatsCardProps) {
  return (
    <div style={{
      flex: 1, background: '#111', border: '1px solid #1f1f1f', borderRadius: 12,
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        <div style={{ width: 34, height: 34, background: iconBg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ color: '#f3f4f6', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        {subtext && <div style={{ color: '#4ade80', fontSize: 12, marginTop: 6 }}>{subtext}</div>}
      </div>
    </div>
  )
}
