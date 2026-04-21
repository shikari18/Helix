import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `https://${process.env.NEXT_PUBLIC_API_URL}`
  : 'http://localhost:8000'

export async function POST() {
  try {
    const res = await fetch(`${API_URL}/api/agent/wifi-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unavailable', networks: [] }, { status: 500 })
  }
}
