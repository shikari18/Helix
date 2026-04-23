import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { room_id: string } }
) {
  try {
    const roomId = params.room_id
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000'
    const url = `${backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`}/api/rooms/${roomId}/exists`
    
    console.log(`[Proxy] Checking room existence: ${url}`)

    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ exists: false }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (err: any) {
    console.error('[Proxy] Room check error:', err)
    return NextResponse.json({ exists: false, error: err.message }, { status: 500 })
  }
}
