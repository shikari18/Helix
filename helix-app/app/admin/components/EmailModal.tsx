'use client'

import { useState } from 'react'

interface EmailModalProps {
  open: boolean
  to: string
  onClose: () => void
  onSend: (subject: string, body: string) => Promise<void>
}

export default function EmailModal({ open, to, onClose, onSend }: EmailModalProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSend(subject, body)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSubject('')
        setBody('')
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Failed to send email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    setSubject('')
    setBody('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 14,
          padding: '28px 32px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Send Email</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
          To: <span style={{ color: '#a5b4fc' }}>{to}</span>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#4ade80', fontSize: 16, fontWeight: 600 }}>
            ✓ Email sent successfully
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter subject..."
                style={{
                  width: '100%',
                  background: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                disabled={loading}
                placeholder="Write your message..."
                rows={6}
                style={{
                  width: '100%',
                  background: '#111',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(180,40,40,0.15)', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: '1px solid #2a2a2a',
                  background: 'transparent',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !subject.trim() || !body.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: loading ? '#333' : '#4f46e5',
                  color: loading ? '#666' : '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  minWidth: 80,
                }}
              >
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
