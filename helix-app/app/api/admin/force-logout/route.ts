import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const ADMIN_SECRET = process.env.ADMIN_SECRET

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/force-logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': ADMIN_SECRET || '' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
