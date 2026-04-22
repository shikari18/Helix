import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  let backend = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000'
  
  const wsUrl = backend.startsWith('http') ? backend : `https://${backend}`
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  
  return NextResponse.json({ wsUrl, googleClientId })
}
