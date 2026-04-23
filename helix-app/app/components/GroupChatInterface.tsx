'use client'

import { useState, useRef, useEffect } from 'react'
import { WebSocketClient } from '../lib/WebSocketClient'
import type { GroupMessage, Participant, ConnectionState } from '../types/groupChat'
import { parseCodeBlocks, renderMarkdown } from '../lib/markdown'
import CodeBlock from './CodeBlock'

interface Props {
  roomId: string
  onBack: () => void
}

export default function GroupChatInterface({ roomId, onBack }: Props) {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [inputValue, setInputValue] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [inviteLink, setInviteLink] = useState('')
  const [showInvitePopup, setShowInvitePopup] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [helixTyping, setHelixTyping] = useState(false)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDictating, setIsDictating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  // The participant ID the server assigned to ME after joining
  const myParticipantIdRef = useRef<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsClientRef = useRef<WebSocketClient | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const userScrolledRef = useRef(false)
  const lastScrollTimeRef = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const shownSystemMsgsRef = useRef<Set<string>>(new Set())
  const currentUserIdRef = useRef<string | null>(null)
  if (!currentUserIdRef.current) {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`group_uid_${roomId}`)
      if (stored) {
        currentUserIdRef.current = stored
      } else {
        const newId = `user-${Date.now()}`
        sessionStorage.setItem(`group_uid_${roomId}`, newId)
        currentUserIdRef.current = newId
      }
    } else {
      currentUserIdRef.current = `user-${Date.now()}`
    }
  }
  const currentUserId = currentUserIdRef.current!

  const addSystemMessage = (key: string, content: string) => {
    if (shownSystemMsgsRef.current.has(key)) return
    shownSystemMsgsRef.current.add(key)
    setMessages(prev => [...prev, {
      id: `sys-${key}-${Date.now()}`,
      roomId, senderId: 'system', senderName: 'system',
      senderAvatar: '', content,
      timestamp: Date.now(), isHelixResponse: false,
    }])
    setTimeout(() => shownSystemMsgsRef.current.delete(key), 10000)
  }
  const userName = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_name') || 'You') : 'You'
  const userPicture = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_picture') || '') : ''

  // Request push notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setError(null)
        setConnectionState('reconnecting')
        let wsUrl = process.env.NEXT_PUBLIC_WS_URL || ''
        
        // Dynamically fetch from our proxy config just in case static env substitution failed
        if (!wsUrl || (typeof window !== 'undefined' && wsUrl.includes(window.location.hostname))) {
          try {
            const res = await fetch('/api/config')
            if (res.ok) {
              const data = await res.json()
              if (data.wsUrl) wsUrl = data.wsUrl
            }
          } catch (err) {
            console.error('Failed to fetch dynamic wsUrl config', err)
          }
        }

        // Fallback to localhost if all else fails natively
        if (!wsUrl && typeof window !== 'undefined') {
          const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.startsWith('192.168')
          wsUrl = isLocalhost
            ? `http://${window.location.hostname}:8000`
            : `https://${window.location.hostname}`
        }

        const wsClient = new WebSocketClient(wsUrl)
        wsClientRef.current = wsClient

        wsClient.onMessage((message) => {
          setMessages(prev => {
            if (prev.find(m => m.id === message.id)) return prev
            return [...prev, message]
          })
          if (message.isHelixResponse) {
            setHelixTyping(false)
          } else {
            setTypingUsers(prev => prev.filter(n => n !== message.senderName))
          }
        })

        wsClient.onParticipantJoin((participant) => {
          setParticipants(prev => {
            if (prev.find(p => p.id === participant.id)) return prev
            return [...prev, participant]
          })
          if (participant.id !== currentUserId) {
            addSystemMessage(`join-${participant.id}`, `${participant.name} joined the chat`)
          }
        })

        wsClient.onParticipantLeave((participantId) => {
          setParticipants(prev => {
            const leaving = prev.find(p => p.id === participantId)
            if (leaving) {
              addSystemMessage(`leave-${participantId}`, `${leaving.name} left the chat`)
            }
            return prev.filter(p => p.id !== participantId)
          })
        })

        wsClient.onConnectionChange((state) => {
          setConnectionState(state)
        })

        wsClient.onUserTyping((name, isTyping) => {
          setTypingUsers(prev => {
            if (isTyping) {
              return prev.includes(name) ? prev : [...prev, name]
            } else {
              return prev.filter(n => n !== name)
            }
          })
        })

        wsClient.onHelixTyping((isTyping) => {
          setHelixTyping(isTyping)
        })

        const participant: Participant = {
          id: currentUserId,
          name: userName,
          avatar: userPicture,
          joinedAt: Date.now(),
          isOnline: true,
        }

        const result = await wsClient.connect(roomId, participant)

        if (result.success) {
          myParticipantIdRef.current = currentUserId
          setMessages(result.messages || [])
          setParticipants(result.participants || [])
          setInviteLink(`${window.location.origin}/group/${roomId}`)
          setError(null)
          setConnectionState('connected')
        } else if (result.error === 'Room not found') {
          setError('room_expired')
          setConnectionState('disconnected')
        } else {
          setError(result.error || 'Failed to connect to room')
          setConnectionState('disconnected')
        }
      } catch (err) {
        setError('Failed to connect to server')
        setConnectionState('disconnected')
      }
    }

    initializeConnection()

    return () => {
      // Don't disconnect on unmount — room persists until user explicitly leaves
      // Just stop listening to events
    }
  }, [roomId, currentUserId, userName, userPicture])

  useEffect(() => {
    if (!userScrolledRef.current && Date.now() - lastScrollTimeRef.current >= 2000) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    }
  }, [messages, helixTyping, typingUsers])

  const handleSend = async () => {
    if (!inputValue.trim() && uploadedImages.length === 0) return
    if (!wsClientRef.current) return

    const messageContent = inputValue
    const imagesToSend = [...uploadedImages]
    setInputValue('')
    setUploadedImages([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // stop typing
    if (isTypingRef.current) {
      wsClientRef.current.emitTypingStop(roomId, userName)
      isTypingRef.current = false
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    await wsClientRef.current.sendMessage(roomId, {
      roomId,
      senderId: currentUserId,
      senderName: userName,
      senderAvatar: userPicture,
      content: messageContent || (imagesToSend.length > 0 ? '📷 Image' : ''),
      images: imagesToSend,
      isHelixResponse: false,
    } as any)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = evt => {
          if (evt.target?.result) {
            setUploadedImages(prev => [...prev, evt.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      }
    })
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDictation = () => {
    if (isDictating) {
      setIsDictating(false)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) { alert('Voice dictation not supported in this browser.'); return }
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript
        setInputValue(transcript)
      }
      recognition.onerror = () => { setIsDictating(false); recognitionRef.current = null }
      recognition.onend = () => { setIsDictating(false); recognitionRef.current = null }
      recognition.start()
      recognitionRef.current = recognition
      setIsDictating(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    }

    if (!wsClientRef.current) return

    // emit typing start
    if (!isTypingRef.current) {
      isTypingRef.current = true
      wsClientRef.current.emitTypingStart(roomId, userName)
    }

    // reset stop-typing timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      if (wsClientRef.current && isTypingRef.current) {
        wsClientRef.current.emitTypingStop(roomId, userName)
        isTypingRef.current = false
      }
    }, 3000)
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setShowInvitePopup(false)
  }

  const handleLeave = () => {
    if (wsClientRef.current) {
      wsClientRef.current.leaveRoom(roomId, currentUserId)
      wsClientRef.current.disconnect()
      wsClientRef.current = null
    }
    onBack()
  }

  const hasContent = inputValue.trim().length > 0

  // Deduplicated participants — dedup by ID
  const uniqueParticipants = participants.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
  const otherParticipants = uniqueParticipants.filter(p => p.id !== currentUserId)

  if (error && (error.includes('Room not found') || error === 'room_expired')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#141414', flexDirection: 'column', gap: 16, fontFamily: 'inherit', textAlign: 'center', padding: 20 }}>
        <div style={{ fontSize: 32 }}>💬</div>
        <h2 style={{ color: '#fff', margin: 0, fontSize: 18 }}>Group chat expired</h2>
        <p style={{ color: '#888', margin: 0, fontSize: 14, maxWidth: 280, lineHeight: 1.6 }}>This room no longer exists. The server may have restarted or the session ended.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onBack} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #3d3d3d', borderRadius: 8, color: '#888', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Go Back</button>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Re-sync</button>
        </div>
      </div>
    )
  }

  if (error && error !== 'room_expired') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#141414', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Connection Error</h2>
        <p style={{ color: '#888', margin: 0 }}>{error}</p>
        <button onClick={onBack} style={{ padding: '10px 24px', background: '#fff', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="group-chat-container">

      {/* Room ID Display — top center */}
      <div className="room-id-header">
        <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Room ID</span>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'monospace' }}>{roomId}</div>
      </div>

      {/* Leave button — red door icon at top left */}
      <button className="leave-btn" onClick={handleLeave} title="Leave chat">
        {/* Red door SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Door frame */}
          <rect x="3" y="2" width="13" height="20" rx="1" stroke="#ff6b6b" strokeWidth="1.8" fill="none"/>
          {/* Door knob */}
          <circle cx="14" cy="12" r="1" fill="#ff6b6b"/>
          {/* Arrow leaving */}
          <polyline points="17 8 21 12 17 16" stroke="#ff6b6b" strokeWidth="1.8"/>
          <line x1="21" y1="12" x2="11" y2="12" stroke="#ff6b6b" strokeWidth="1.8"/>
        </svg>
      </button>

      {/* Connection Status */}
      {connectionState !== 'connected' && (
        <div className="connection-status">
          {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
        </div>
      )}

      {/* Invite Popup */}
      {showInvitePopup && (
        <div className="invite-popup">
          <h3>Invite with link</h3>
          <div className="invite-link-box">
            <input type="text" value={inviteLink} readOnly />
            <button onClick={copyInviteLink} className="copy-btn">Copy</button>
          </div>
        </div>
      )}

      {/* Participant avatars — stacked chain at top right */}
      <div className="participants-row">
        {/* Helix first (leftmost visually due to row-reverse) */}
        <div className="avatar-wrap helix-avatar" title="Helix AI">
          <img src="/image.png" alt="Helix" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain', background: '#000' }} />
        </div>

        {/* Current user */}
        <div className="avatar-wrap" title={userName}>
          {userPicture ? (
            <img src={userPicture} alt={userName} referrerPolicy="no-referrer" />
          ) : (
            <div className="avatar-initial">{userName.charAt(0).toUpperCase()}</div>
          )}
        </div>
        
        {/* Others */}
        {otherParticipants.map(p => (
          <div key={p.id} className="avatar-wrap" title={p.name}>
            {p.avatar ? (
              <img src={p.avatar} alt={p.name} referrerPolicy="no-referrer" />
            ) : (
              <div className="avatar-initial">{p.name.charAt(0).toUpperCase()}</div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div 
        className="group-chat-messages"
        ref={scrollContainerRef}
        onScroll={() => {
          const el = scrollContainerRef.current
          if (!el) return
          const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
          if (distFromBottom > 80) {
            userScrolledRef.current = true
            lastScrollTimeRef.current = Date.now()
          } else {
            userScrolledRef.current = false
          }
        }}
      >
        {messages.length === 0 && (
          <div className="empty-state">
            <div style={{ color: '#444', fontSize: 13 }}>Conversation initiated. Welcome to {roomId}.</div>
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.senderId === currentUserId
          const isHelix = msg.isHelixResponse
          const isSystem = msg.senderId === 'system'

          // System message (joined/left)
          if (isSystem) {
            return (
              <div key={msg.id} style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: '#555', background: '#1a1a1a', padding: '4px 12px', borderRadius: 20 }}>
                  {msg.content}
                </span>
              </div>
            )
          }

          if (isOwn) {
            return (
              <div key={msg.id} style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' }}>
                {(msg as any).images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 8 }}>
                    {(msg as any).images.map((src: string, i: number) => (
                      <img 
                        key={i} 
                        src={src} 
                        alt="" 
                        onClick={() => setSelectedImage(src)}
                        style={{ maxWidth: 'min(300px, 80%)', borderRadius: 14, objectFit: 'cover', border: '1px solid #333', cursor: 'zoom-in' }} 
                      />
                    ))}
                  </div>
                )}
                {msg.content && msg.content !== '📷 Image' && (
                  <div style={{
                    background: '#2d2d2d',
                    padding: '10px 16px',
                    borderRadius: '18px 18px 4px 18px',
                    border: '1px solid #3d3d3d',
                    maxWidth: '85%',
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: '#fff',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>
                )}
              </div>
            )
          }

          return (
            <div key={msg.id} style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', width: '100%' }}>
              {isHelix ? (
                <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>HELIX</div>
              ) : (
                <div style={{ fontSize: 12, color: '#666' }}>{msg.senderName}</div>
              )}
                {(msg as any).images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {(msg as any).images.map((src: string, i: number) => (
                      <img 
                        key={i} 
                        src={src} 
                        alt="" 
                        onClick={() => setSelectedImage(src)}
                        style={{ maxWidth: 'min(300px, 80%)', borderRadius: 14, objectFit: 'cover', border: '1px solid #333', cursor: 'zoom-in' }} 
                      />
                    ))}
                  </div>
                )}
              {msg.content && msg.content !== '📷 Image' && (
                <div style={{
                  background: isHelix ? 'transparent' : '#1a1a1a',
                  padding: isHelix ? '0' : '10px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  border: isHelix ? 'none' : '1px solid #2d2d2d',
                  maxWidth: '85%',
                  fontSize: isHelix ? 18 : 16,
                  lineHeight: 1.6,
                  color: '#fff',
                  wordBreak: 'break-word',
                  minWidth: 'fit-content'
                }}>
                  {isHelix ? (
                    (() => {
                      const parts = parseCodeBlocks(msg.content)
                      return parts.map((part, i) => {
                        if (part.type === 'code') {
                          return <CodeBlock key={i} language={part.language || ''} content={part.content} />
                        }
                        return (
                          <div
                            key={i}
                            className="md-body"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }}
                          />
                        )
                      })
                    })()
                  ) : (
                    msg.content
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Inline typing indicators — only show others typing, never yourself */}
        {typingUsers.filter(n => n !== userName).map(name => (
          <div key={name} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{name.toUpperCase()}</div>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        ))}

        {/* Helix typing */}
        {helixTyping && (
          <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>HELIX</div>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Lightbox Modal */}
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', animation: 'fadeIn 0.2s ease' }}
          >
            <img src={selectedImage} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 12 }} />
            <button style={{ position: 'absolute', top: 30, right: 30, background: 'none', border: 'none', color: '#fff', fontSize: 40, cursor: 'pointer' }}>×</button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="group-chat-input-section">
        <div className="input-container">
          <div className="input-wrapper">
            {/* Image previews */}
            {uploadedImages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
                {uploadedImages.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                    <img src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #3d3d3d' }} />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ff4444', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="textarea-wrapper">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="Message group chat..."
                id="messageInput"
                spellCheck={false}
                disabled={connectionState === 'disconnected'}
              />
            </div>
            <div className="input-footer">
              <div className="input-actions">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Upload images">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="right-actions">
                <button
                  className={`icon-btn ${isDictating ? 'dictating' : ''}`}
                  onClick={handleDictation}
                  title="Voice Dictation"
                >
                  {!isDictating ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2"/>
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleSend}
                  className={`send-btn ${(inputValue.trim() || uploadedImages.length > 0) ? 'send-mode' : 'voice-mode'}`}
                  disabled={connectionState === 'disconnected'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .group-chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #141414;
          color: #e0e0e0;
          position: relative;
        }

        /* Copy invite link — top center */
        .copy-link-top {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #1a1a1a;
          border: 1px solid #3d3d3d;
          border-radius: 20px;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 200;
          font-family: inherit;
          white-space: nowrap;
        }
        .copy-link-top:hover {
          background: #2d2d2d;
          color: #fff;
          border-color: #555;
        }

        /* Leave button — top left */
        .leave-btn {
          position: fixed;
          top: 20px;
          left: 72px;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid #5a2020;
          background: #1a1a1a;
          color: #ff6b6b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 200;
        }
        .leave-btn:hover {
          background: #2d1a1a;
          border-color: #ff6b6b;
        }

        /* Connection Status */
        .room-id-header {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          z-index: 100;
          pointer-events: none;
        }

        .connection-status {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #2d2d2d;
          border: 1px solid #3d3d3d;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          color: #888;
          z-index: 1000;
        }

        /* Participant avatars row — stacked chain at top right */
        .participants-row {
          position: fixed;
          top: 18px;
          right: 20px;
          display: flex;
          flex-direction: row-reverse;
          align-items: center;
          z-index: 9999;
        }

        .avatar-wrap {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #141414;
          flex-shrink: 0;
          margin-left: -10px;
        }

        .avatar-wrap:last-child {
          margin-left: 0;
        }

        .avatar-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initial {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3a3a3a;
          color: #fff;
          font-weight: 600;
          font-size: 16px;
        }

        /* Invite Popup */
        .invite-popup {
          position: fixed;
          top: 70px;
          right: 20px;
          background: #1c1c1c;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 16px;
          width: 320px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          z-index: 1000;
        }

        .invite-popup h3 {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 12px 0;
        }

        .invite-link-box {
          display: flex;
          gap: 8px;
        }

        .invite-link-box input {
          flex: 1;
          background: #0d0d0d;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 8px 12px;
          color: #888;
          font-size: 13px;
          outline: none;
        }

        .copy-btn {
          background: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          color: #000;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Messages */
        .group-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 80px 20px 200px;
          padding-left: max(40px, calc((100% - 930px) / 2));
          padding-right: max(40px, calc((100% - 930px) / 2));
        }

        @media (max-width: 768px) {
          .group-chat-messages {
            padding: 80px 16px 180px;
          }
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding-top: 120px;
          text-align: center;
        }

        .empty-time { font-size: 11px; color: #555; letter-spacing: 1px; }
        .empty-creator { font-size: 14px; color: #aaa; margin: 0; }
        .empty-note { font-size: 12px; color: #555; max-width: 300px; line-height: 1.5; margin: 4px 0 8px; }

        .invite-btn {
          padding: 9px 20px;
          border: 1px solid #3a3a3a;
          background: transparent;
          border-radius: 10px;
          font-size: 14px;
          color: #ddd;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .invite-btn:hover { background: #1f1f1f; border-color: #4a4a4a; }

        /* Typing dots animation */
        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
          height: 20px;
        }

        .typing-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #555;
          animation: bounce 1.2s infinite ease-in-out;
        }

        .typing-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); background: #555; }
          30% { transform: translateY(-5px); background: #888; }
        }

        /* Input */
        .group-chat-input-section {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          padding: 0 20px 20px;
          background: #141414;
          z-index: 20;
          box-shadow: 0 -20px 40px #141414;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .input-container {
          width: 100%;
          max-width: 910px;
          background: #1a1a1a;
          border-radius: 28px;
          padding: 20px 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 80px;
        }

        .textarea-wrapper { position: relative; }

        #messageInput {
          font-family: inherit;
          font-size: 20px;
          line-height: 1.5;
          padding: 0; margin: 0;
          border: none;
          width: 100%;
          min-height: 40px;
          max-height: 300px;
          background: transparent;
          color: #fff;
          outline: none;
          resize: none;
          overflow-y: auto;
          caret-color: rgba(255,255,255,0.4);
        }

        #messageInput::placeholder { color: #808080; }
        #messageInput:disabled { opacity: 0.4; cursor: not-allowed; }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .input-actions { display: flex; gap: 12px; align-items: center; }

        .icon-btn {
          width: 36px; height: 36px;
          border-radius: 18px;
          border: 1px solid #2d2d2d;
          background: #1a1a1a;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          color: #fff;
          position: relative;
        }
        .icon-btn:hover { background: #2d2d2d; }
        .icon-btn svg { stroke: #fff; }
        .icon-btn.dictating {
          background: #1a1a1a;
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.15), 0 0 12px rgba(255,255,255,0.2);
          animation: dictPulse 1.5s ease-in-out infinite;
        }
        @keyframes dictPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,0.15), 0 0 12px rgba(255,255,255,0.2); }
          50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.25), 0 0 20px rgba(255,255,255,0.35); }
        }

        .right-actions { display: flex; align-items: center; gap: 12px; }

        .send-btn {
          width: 44px; height: 44px;
          border-radius: 22px;
          border: none;
          background: #2d2d2d;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn svg { width: 20px; height: 20px; stroke: #666; }
        .send-btn.send-mode { background: #fff; }
        .send-btn.send-mode svg { stroke: #1a1a1a; }
        .send-btn.send-mode:hover { background: #e0e0e0; }

        @media (max-width: 768px) {
          .group-chat-input-section { padding: 0 12px 12px; }
          .input-container { padding: 16px 18px; }
          .leave-btn { left: 62px; }
        }
      `}</style>
    </div>
  )
}
