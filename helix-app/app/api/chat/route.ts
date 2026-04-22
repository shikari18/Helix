import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for HELIX Chat
 * Forwards requests to the consolidated Python backend
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Construct the backend URL
    const url = `${BACKEND_URL.startsWith('http') ? BACKEND_URL : `http://${BACKEND_URL}`}/api/chat`
    
    console.log(`[Proxy] Forwarding chat request to: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Proxy] Backend error: ${response.status}`, errorText)
      return NextResponse.json({ error: 'Backend service error' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (err: any) {
    console.error('[Proxy] Chat API error:', err)
    return NextResponse.json({ error: 'Internal server proxy error', details: err.message }, { status: 500 })
  }
}
