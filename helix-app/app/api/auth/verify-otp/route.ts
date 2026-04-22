import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `https://${process.env.NEXT_PUBLIC_API_URL}`
  : 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()

  // Register user in the registry on successful OTP verification
  if (res.ok && data.email) {
    try {
      await fetch(`${API_URL}/api/admin/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': process.env.ADMIN_SECRET || '',
        },
        body: JSON.stringify({ email: data.email, name: data.name || data.email.split('@')[0] }),
      })
    } catch {}
  }

  return NextResponse.json(data, { status: res.status })
}
