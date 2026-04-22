import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const host = req.headers.get('host') || ''
  let backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_WS_URL || ''
  
  if (!backend || backend.includes('localhost') || !backend.includes('.')) {
      if (host.includes('-app-')) {
          backend = `https://${host.replace('-app-', '-api-')}`
      } else {
          backend = 'http://localhost:8000'
      }
  }
  
  const wsUrl = backend.startsWith('http') ? backend : `https://${backend}`
  return NextResponse.json({ wsUrl })
}
