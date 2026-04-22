import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for HELIX Chat
 * Forwards requests to the consolidated Python backend
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Determine backend URL cleanly. Strongly prefer the explicit public URL string to bypass any internal cluster routing issues.
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000'

    // Construct the backend URL
    const url = `${backendUrl.startsWith('http') ? backendUrl : `https://${backendUrl}`}/api/chat`
    
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
