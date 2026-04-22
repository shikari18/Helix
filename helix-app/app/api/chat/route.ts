import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for HELIX Chat
 * Forwards requests to the consolidated Python backend
 */

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get('host') || ''
    const body = await req.json()
    
    // Determine the public or private backend URL reliably
    let backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || ''
    
    // Fallback heuristic: If we are on Render (domain contains -app-), dynamically infer the api container URL
    if (!backendUrl || backendUrl.includes('localhost') || !backendUrl.includes('.')) {
      if (host.includes('-app-')) {
        backendUrl = `https://${host.replace('-app-', '-api-')}`
      } else {
        backendUrl = 'http://localhost:8000'
      }
    }

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
