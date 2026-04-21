import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `https://${process.env.NEXT_PUBLIC_API_URL}`
  : 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') || 'Unknown'
  const browser = req.headers.get('user-agent') || 'Unknown'

  const res = await fetch(`${API_URL}/api/auth/login-alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ip, browser }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
