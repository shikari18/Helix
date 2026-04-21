import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) return NextResponse.json({ title: 'New Chat' })

  try {
    const { message } = await req.json()
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${GEMINI_API_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Generate a short descriptive chat title in Title Case for this message. 3-5 words. No quotes, no punctuation at end, no emojis. Plain text only. Examples: "SQL Injection Basics", "Nmap Scan Help", "CTF Web Challenge", "Buffer Overflow Help", "WiFi Cracking Guide", "Python Script Automation". Message: "${message.slice(0, 200)}"` }] }],
        generationConfig: { maxOutputTokens: 20 },
      }),
    })
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || message.slice(0, 30)
    const title = raw.replace(/[*#_`\n"']/g, '').trim().slice(0, 40)
    return NextResponse.json({ title })
  } catch {
    return NextResponse.json({ title: 'New Chat' })
  }
}
