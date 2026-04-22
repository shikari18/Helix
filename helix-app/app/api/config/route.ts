import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const backend = process.env.BACKEND_URL || 'http://localhost:8000'
  const wsUrl = backend.startsWith('http') ? backend : `https://${backend}`
  return NextResponse.json({ wsUrl })
}
