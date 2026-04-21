import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Get IP from request headers
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 'Unknown'
  const browser = req.headers.get('user-agent') || 'Unknown'
  
  const res = await fetch('http://localhost:8000/api/auth/login-alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ip, browser }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
