interface StatCardsProps {
  totalUsers: number
  blockedUsers: number
  activeToday: number
  totalMessages: number
}

const cards = [
  { key: 'totalUsers', label: 'Total Users' },
  { key: 'blockedUsers', label: 'Blocked Users' },
  { key: 'activeToday', label: 'Active Today' },
  { key: 'totalMessages', label: 'Total Messages' },
] as const

export default function StatCards({ totalUsers, blockedUsers, activeToday, totalMessages }: StatCardsProps) {
  const values = { totalUsers, blockedUsers, activeToday, totalMessages }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
      {cards.map(({ key, label }) => (
        <div
          key={key}
          style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            padding: '20px 24px',
          }}
        >
          <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </div>
          <div style={{ color: '#fff', fontSize: '28px', fontWeight: 700 }}>
            {values[key].toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
