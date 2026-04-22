import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const ADMIN_SECRET = process.env.ADMIN_SECRET

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': ADMIN_SECRET || '',
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Admin users proxy error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
