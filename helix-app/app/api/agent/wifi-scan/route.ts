import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const res = await fetch('http://localhost:8000/api/agent/wifi-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unavailable', networks: [] }, { status: 500 })
  }
}
