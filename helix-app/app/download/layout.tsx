export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#141414',
      color: '#e8e8e8',
      minHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {children}
    </div>
  )
}
