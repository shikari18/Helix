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
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Admin users fetch failed [${res.status}]:`, errorText)
      return NextResponse.json({ error: `Backend returned ${res.status}`, detail: errorText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('Admin users proxy connection error:', err.message)
    return NextResponse.json({ error: 'Connection failed', detail: err.message }, { status: 503 })
  }
}
