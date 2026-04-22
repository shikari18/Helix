'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { Message, ChatItem, ChatMode } from '../types'
import Sidebar from './Sidebar'
import TopControls from './TopControls'
import LandingNavbar from './LandingNavbar'
import ChatMessages from './ChatMessages'
import InputSection from './InputSection'
import LandingScreen from './LandingScreen'
import GhostModeInfo from './GhostModeInfo'
import ShareModal from './ShareModal'
import LandingFooter from './LandingFooter'
import GroupChatInterface from './GroupChatInterface'

const GREETINGS = [
  'What are we breaking today, {name}?',
  'Pick a target, {name}.',
  'Ready to run recon, {name}?',
  'Which exploit are we testing, {name}?',
  'Ready to pop a shell, {name}?',
  'Time to enumerate, {name}.',
  'Drop a target, {name}.',
  'What\'s the attack surface, {name}?',
  'Let\'s find some vulns, {name}.',
  'What are we pwning today, {name}?',
]

// Greeting response pools — shuffled per message
const GREETING_RESPONSES: Record<string, string[]> = {
  hey: [
    'hey 👋', 'hey, what\'s up?', 'hey 👀', 'hey! what\'s good?', 'heyyy 👋',
    'hey, sup?', 'hey there 👋', 'hey! how\'s it going?', 'hey 😎', 'hey, what\'s the move?',
  ],
  hi: [
    'hi 👋', 'hi! how are you?', 'hi there 👋', 'hi, what\'s up?', 'hiiii 👋',
    'hi! what\'s good?', 'hi 😊', 'hi, how\'s it going?', 'hi! what\'s on your mind?', 'hi 👀',
  ],
  yo: [
    'yo 👋', 'yo, what\'s good?', 'yo! 👀', 'yo, what\'s up?', 'yooo 👋',
    'yo! how\'s it going?', 'yo 😎', 'yo, what\'s the move?', 'yo! what\'s good?', 'yo, sup?',
  ],
  sup: [
    'sup 👋', 'not much, you?', 'sup! 👀', 'sup, what\'s good?', 'supp 👋',
    'sup! how\'s it going?', 'sup 😎', 'sup, what\'s the move?', 'sup! what\'s good?', 'sup, all good?',
  ],
}

export function getGreetingResponse(message: string): string | null {
  const trimmed = message.trim().toLowerCase().replace(/[!?.]+$/, '')
  for (const [key, pool] of Object.entries(GREETING_RESPONSES)) {
    if (trimmed === key || trimmed === key + ' ' || trimmed.startsWith(key + ' ') && trimmed.length < key.length + 4) {
      return pool[Math.floor(Math.random() * pool.length)]
    }
  }
  return null
}

function getUserName() {
  if (typeof window === 'undefined') return 'Shikari'
  return localStorage.getItem('helix_user_name') || 'Shikari'
}

function randomGreeting() {
  const name = getUserName()
  const template = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  return template.replace('{name}', name)
}

export default function ChatApp() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isGhostMode, setIsGhostMode] = useState(false)
  const [chatActive, setChatActive] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatList, setChatList] = useState<ChatItem[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  // Store messages per chat: { [chatId]: Message[] }
  const [chatStore, setChatStore] = useState<Record<string, Message[]>>({})
  const [chatMode, setChatMode] = useState<ChatMode>('chat')
  const [isThinking, setIsThinking] = useState(false)
  const [typingMsgId, setTypingMsgId] = useState<string | null>(null)
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Always-current messages ref to avoid stale closures
  const messagesRef = useRef<Message[]>([])
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [greeting, setGreeting] = useState(randomGreeting)
  const [newChatKey, setNewChatKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  // Agent action prompt
  const [agentPrompt, setAgentPrompt] = useState<{ actionType: string; message: string; originalMessage: string } | null>(null)
  const [agentRunning, setAgentRunning] = useState(false)
  // Split view state
  const [splitViewUrl, setSplitViewUrl] = useState<string | null>(null)
  // Group chat state
  const [isGroupChat, setIsGroupChat] = useState(false)
  const [groupChatRoomId, setGroupChatRoomId] = useState<string | null>(null)
  const [groupChatName, setGroupChatName] = useState('New group chat')

  // Persist group chat state — restore on refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGroupChat = localStorage.getItem('helix_group_chat')
      const savedRoomId = localStorage.getItem('helix_group_room_id')
      const savedGroupName = localStorage.getItem('helix_group_name')
      if (savedGroupChat === 'true' && savedRoomId) {
        // Verify the room still exists before restoring
        fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/admin/users`, {
          method: 'GET',
          headers: { 'X-Admin-Secret': 'helix-admin-secret-2026' }
        }).catch(() => {})
        // Just restore — GroupChatInterface will handle room_expired if server restarted
        setIsGroupChat(true)
        setGroupChatRoomId(savedRoomId)
        setGroupChatName(savedGroupName || 'New group chat')
        setCurrentChatId(savedRoomId)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isGroupChat && groupChatRoomId) {
        localStorage.setItem('helix_group_chat', 'true')
        localStorage.setItem('helix_group_room_id', groupChatRoomId)
        localStorage.setItem('helix_group_name', groupChatName)
      } else {
        localStorage.removeItem('helix_group_chat')
        localStorage.removeItem('helix_group_room_id')
        localStorage.removeItem('helix_group_name')
      }
    }
  }, [isGroupChat, groupChatRoomId, groupChatName])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    
    // Intercept all md-link clicks globally — prevents navigation, opens split view
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a.md-link')
      if (target) {
        e.preventDefault()
        e.stopPropagation()
        const url = target.getAttribute('data-url')
        if (url) {
          // On mobile, open in new tab instead of split view
          if (window.innerWidth < 768) {
            window.open(url, '_blank')
          } else {
            setSplitViewUrl(url)
          }
        }
      }
    }
    document.addEventListener('click', handleLinkClick, true)
    
    return () => {
      window.removeEventListener('resize', check)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [])
  const [pageTitle, setPageTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('helix_user_email') || 'guest'
      const safe = email.replace(/[^a-zA-Z0-9]/g, '_')
      return localStorage.getItem(`helix_page_title_${safe}`) || 'Helix'
    }
    return 'Helix'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  // ── Per-account storage keys ──
  const getStorageKeys = () => {
    const email = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_email') || 'guest') : 'guest'
    const safe = email.replace(/[^a-zA-Z0-9]/g, '_')
    return {
      chatStore: `helix_chat_store_${safe}`,
      chatList: `helix_chat_list_${safe}`,
      messages: `helix_messages_${safe}`,
      pageTitle: `helix_page_title_${safe}`,
    }
  }

  // ── Rate limiting — per account + per plan ──
  const getPlanLimit = () => {
    const plan = typeof window !== 'undefined' ? (localStorage.getItem('helix_plan') || 'free') : 'free'
    if (plan === 'ultra') return Infinity
    if (plan === 'proplus') return 100
    if (plan === 'pro') return 30
    return 20 // free
  }

  const LIMIT = getPlanLimit()
  const RESET_MS = 24 * 60 * 60 * 1000 // 24 hours

  const getRateLimitKeys = () => {
    const email = typeof window !== 'undefined' ? (localStorage.getItem('helix_user_email') || 'guest') : 'guest'
    const safe = email.replace(/[^a-zA-Z0-9]/g, '_')
    return { countKey: `hl_c_${safe}`, sinceKey: `hl_s_${safe}` }
  }

  const checkLimit = (): boolean => {
    const { countKey, sinceKey } = getRateLimitKeys()
    const count = parseInt(localStorage.getItem(countKey) || '0')
    const since = parseInt(localStorage.getItem(sinceKey) || '0')
    if (!since || Date.now() - since >= RESET_MS) {
      localStorage.removeItem(countKey)
      localStorage.removeItem(sinceKey)
      return false
    }
    return count >= LIMIT
  }

  const [isLimited, setIsLimited] = useState(() => typeof window !== 'undefined' ? checkLimit() : false)

  const trackSend = () => {
    const { countKey, sinceKey } = getRateLimitKeys()
    const since = parseInt(localStorage.getItem(sinceKey) || '0')
    if (!since || Date.now() - since >= RESET_MS) {
      localStorage.setItem(sinceKey, String(Date.now()))
      localStorage.setItem(countKey, '1')
    } else {
      const c = parseInt(localStorage.getItem(countKey) || '0') + 1
      localStorage.setItem(countKey, String(c))
      if (c >= LIMIT) setIsLimited(true)
    }
  }

  // Auto-reset check every 60s
  useEffect(() => {
    const t = setInterval(() => { if (checkLimit() === false) setIsLimited(false) }, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const poll = setInterval(async () => {
      const email = typeof window !== 'undefined' ? localStorage.getItem('helix_user_email') : null
      if (!email) return
      try {
        const res = await fetch('/api/auth/check-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (data.forceLogout) {
          localStorage.removeItem('helix_logged_in')
          window.location.href = '/signup?blocked=1'
        }
      } catch {}
    }, 10000)
    return () => clearInterval(poll)
  }, [])

  // Update browser tab title
  useEffect(() => {
    document.title = pageTitle
  }, [pageTitle])

  // Persist chatStore across refresh
  useEffect(() => {
    const keys = getStorageKeys()
    const saved = localStorage.getItem(keys.chatStore)
    if (saved) {
      try { setChatStore(JSON.parse(saved)) } catch {}
    }
    const savedList = localStorage.getItem(keys.chatList)
    if (savedList) {
      try { setChatList(JSON.parse(savedList)) } catch {}
    }
  }, [])

  useEffect(() => {
    const keys = getStorageKeys()
    localStorage.setItem(keys.chatStore, JSON.stringify(chatStore))
  }, [chatStore])

  useEffect(() => {
    const keys = getStorageKeys()
    localStorage.setItem(keys.chatList, JSON.stringify(chatList))
  }, [chatList])

  // Persist current messages across refresh
  useEffect(() => {
    const keys = getStorageKeys()
    const saved = localStorage.getItem(keys.messages)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.length > 0) {
          setMessages(parsed)
          setChatActive(true)
        }
      } catch {}
    }
  }, [])

  useEffect(() => {
    const keys = getStorageKeys()
    if (messages.length > 0) {
      localStorage.setItem(keys.messages, JSON.stringify(messages))
      if (currentChatId) {
        setChatStore(prev => ({ ...prev, [currentChatId]: messages }))
      }
    } else {
      localStorage.removeItem(keys.messages)
    }
    messagesRef.current = messages
  }, [messages, currentChatId])

  useEffect(() => {
    const stored = localStorage.getItem('helix_logged_in')
    if (stored !== 'true') {
      window.location.href = '/signup'
      return
    }
    setLoggedIn(true)
    // Re-check limit now that email is available
    setIsLimited(checkLimit())
    // Clean up old shared (non-per-account) keys
    localStorage.removeItem('hl_c')
    localStorage.removeItem('hl_s')
  }, [])

  const scrollToBottom = useCallback(() => {
    if (userScrolledRef.current) return
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Always scrolls during typing regardless of user scroll state
  const scrollDuringTyping = useCallback(() => {
    if (userScrolledRef.current) return
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const forceScrollToBottom = useCallback(() => {
    userScrolledRef.current = false
    setShowScrollBtn(false)
    const el = scrollContainerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  // Agent intent detection — runs before API call
  const AGENT_ACTIONS: { pattern: RegExp; actionType: string }[] = [
    { pattern: /\b(scan|show|find|list|detect|check).*(wifi|wi-fi|wireless|network|ssid|hotspot)/i, actionType: 'wifi_scan' },
    { pattern: /\b(wifi|wi-fi|wireless|network).*(scan|around|available|nearby|list)/i, actionType: 'wifi_scan' },
  ]

  const detectAgentIntent = (text: string): string | null => {
    for (const { pattern, actionType } of AGENT_ACTIONS) {
      if (pattern.test(text)) return actionType
    }
    return null
  }

  const sendMessage = useCallback(async (text: string, images: string[] = []) => {
    if (!text.trim() && images.length === 0) return
    if (checkLimit()) { setIsLimited(true); return }

    // Intercept casual greetings — reply from hardcoded pool, skip API
    if (images.length === 0) {
      const greetingReply = getGreetingResponse(text)
      if (greetingReply) {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, images: [], timestamp: Date.now() }
        const replyId = (Date.now() + 1).toString()
        if (!chatActive) {
          setChatActive(true)
          if (!isGhostMode) {
            const newChat: ChatItem = { id: Date.now().toString(), title: 'Quick Hello', pinned: false, timestamp: Date.now() }
            setChatList(prev => [newChat, ...prev])
            setCurrentChatId(newChat.id)
          }
        }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsThinking(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsThinking(false)
        setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: greetingReply, timestamp: Date.now() }])
        return
      }
    }

    // Agent mode intent detection — intercept before API call
    if (chatMode === 'agent' && images.length === 0) {
      const actionType = detectAgentIntent(text)
      if (actionType) {
        setInputValue('')
        setAgentPrompt({ actionType, message: '', originalMessage: text })
        // Add user message to chat
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, images: [], timestamp: Date.now() }
        setMessages(prev => [...prev, userMsg])
        if (!chatActive) {
          setChatActive(true)
          if (!isGhostMode) {
            const newChat: ChatItem = { id: Date.now().toString(), title: 'Agent Scan', pinned: false, timestamp: Date.now() }
            setChatList(prev => [newChat, ...prev])
            setCurrentChatId(newChat.id)
          }
        }
        return
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images,
      timestamp: Date.now(),
    }

    // Snapshot history BEFORE adding the new user message — use ref for latest state
    const historySnapshot = messagesRef.current.map(m => ({ role: m.role, content: m.content }))

    if (!chatActive) {
      setChatActive(true)
      if (!isGhostMode) {
        const newChat: ChatItem = {
          id: Date.now().toString(),
          title: 'New Session...',
          pinned: false,
          timestamp: Date.now(),
        }
        setChatList(prev => [newChat, ...prev])
        setCurrentChatId(newChat.id)
        // Generate hacking-vibe title async
        generateChatTitle(text, newChat.id)
      }
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    stoppedRef.current = false
    trackSend()

    // Check if this was the last allowed message — show fallback and block
    const newCount = parseInt(localStorage.getItem('hl_c') || '0')
    if (newCount >= LIMIT) {
      setIsLimited(true)
      const plan = typeof window !== 'undefined' ? (localStorage.getItem('helix_plan') || 'free') : 'free'
      const limitId = (Date.now() + 1).toString()
      const limitMsg = plan === 'free'
        ? "You've reached your daily limit on the free plan. ⏳ Resets in **24 hours** — or [upgrade to Pro](/pricing) to keep going. 🔐"
        : plan === 'pro'
        ? "You've hit your **30 daily chats** on Pro. ⏳ Your limit resets in **24 hours** — or [upgrade to Pro+](/pricing) for more. 🔐"
        : "You've reached your daily limit on Pro+. ⏳ Resets in **24 hours** — or [upgrade to Ultra](/pricing) for unlimited access. 🔐"
      setMessages(prev => [...prev, {
        id: limitId,
        role: 'assistant',
        content: limitMsg,
        timestamp: Date.now(),
      }])
      return
    }

    setIsThinking(true)
    userScrolledRef.current = false
    setShowScrollBtn(false)
    setTimeout(() => scrollToBottom(), 60)

    // Minimum 2 second spinner
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000))

    let replyText = "I'm having trouble connecting right now. Please check your internet connection and try again."

    // Create abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const [res] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: historySnapshot,
            email: typeof window !== 'undefined' ? (localStorage.getItem('helix_user_email') || '') : '',
            userName: isGhostMode ? 'there' : (typeof window !== 'undefined' ? (localStorage.getItem('helix_user_name') || 'there') : 'there'),
            agentMode: chatMode === 'agent',
            ghostMode: isGhostMode,
          }),
          signal: abortController.signal,
        }),
        minDelay,
      ])
      if (res.status === 403) {
        // Account blocked — force logout
        localStorage.removeItem('helix_logged_in')
        window.location.href = '/signup?blocked=1'
        return
      }
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.reply) replyText = data.reply
    } catch (e: any) {
      if (e?.name === 'AbortError') return // stopped — already handled in handleStop
      await minDelay
    }

    // If stopped during thinking phase, don't start typing
    if (stoppedRef.current) return

    setIsThinking(false)

    // Check for agent action response — fallback if frontend detection missed it
    if (chatMode === 'agent') {
      try {
        const trimmed = replyText.trim()
        const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
        const jsonMatch = stripped.match(/\{[\s\S]*"agent_action"\s*:\s*true[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.agent_action && parsed.action_type) {
            setMessages(prev => prev.filter(m => m.content !== text || m.role !== 'user'))
            setAgentPrompt({ actionType: parsed.action_type, message: parsed.message, originalMessage: text })
            return
          }
        }
      } catch {}
    }

    // Start typing from first 40 chars immediately — no empty flash
    const replyId = (Date.now() + 1).toString()
    setTypingMsgId(replyId)

    let i = Math.min(40, replyText.length)
    setMessages(prev => [...prev, {
      id: replyId,
      role: 'assistant',
      content: replyText.slice(0, i),
      timestamp: Date.now(),
    }])

    if (i < replyText.length) {
      const typeInterval = setInterval(() => {
        if (stoppedRef.current) {
          clearInterval(typeInterval)
          typingIntervalRef.current = null
          setTypingMsgId(null)
          setMessages(prev => prev.map(m =>
            m.id === replyId ? { ...m, content: m.content + '\n\n---\n*Response stopped*' } : m
          ))
          return
        }
        i = Math.min(i + 2, replyText.length)
        setMessages(prev => prev.map(m =>
          m.id === replyId ? { ...m, content: replyText.slice(0, i) } : m
        ))
        scrollDuringTyping()
        if (i >= replyText.length) {
          clearInterval(typeInterval)
          typingIntervalRef.current = null
          setTypingMsgId(null)
          setTimeout(() => scrollDuringTyping(), 100)
        }
      }, 8)
      typingIntervalRef.current = typeInterval
    } else {
      setTypingMsgId(null)
    }

    setTimeout(() => scrollDuringTyping(), 100)
  }, [chatActive, isGhostMode, scrollToBottom, scrollDuringTyping])

  const executeAgentAction = useCallback(async (actionType: string) => {
    setAgentPrompt(null)
    setAgentRunning(true)

    const runningId = Date.now().toString()
    setMessages(prev => [...prev, {
      id: runningId, role: 'assistant',
      content: actionType === 'wifi_scan' ? '📡 Scanning for WiFi networks...' : '⚙️ Running...',
      timestamp: Date.now(),
    }])
    setChatActive(true)

    try {
      const res = await fetch('/api/agent/wifi-scan', { method: 'POST' })
      const data = await res.json()

      let resultText = ''
      if (!data.success) {
        resultText = `❌ Scan failed: ${data.error}`
      } else {
        const nets = data.networks as { ssid: string; signal: string; security: string; bssid: string }[]
        resultText = `📡 **Found ${data.count} WiFi network${data.count !== 1 ? 's' : ''}**\n\n`
        resultText += `| # | SSID | Signal | Security | BSSID |\n`
        resultText += `|---|------|--------|----------|-------|\n`
        nets.forEach((n, i) => {
          resultText += `| ${i + 1} | ${n.ssid || '(Hidden)'} | ${n.signal} | ${n.security || 'Unknown'} | ${n.bssid || '—'} |\n`
        })
        resultText += `\n*Scan completed. ${data.count} network${data.count !== 1 ? 's' : ''} detected.*`
      }

      setMessages(prev => prev.map(m => m.id === runningId ? { ...m, content: resultText } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === runningId ? { ...m, content: '❌ Agent action failed. Make sure the backend server is running.' } : m))
    } finally {
      setAgentRunning(false)
    }
  }, [])

  // Send message in explain mode (forces chat mode, no agent action)
  const sendExplain = useCallback(async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, images: [], timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setChatActive(true)
    setIsThinking(true)
    userScrolledRef.current = false
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000))
    let replyText = "I'm having trouble connecting right now."
    try {
      const [res] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            userName: isGhostMode ? 'there' : (typeof window !== 'undefined' ? (localStorage.getItem('helix_user_name') || 'there') : 'there'),
            agentMode: false,
            ghostMode: isGhostMode,
          }),
        }),
        minDelay,
      ])
      if (res.ok) { const d = await res.json(); if (d.reply) replyText = d.reply }
    } catch { await minDelay }
    setIsThinking(false)
    const replyId = (Date.now() + 1).toString()
    setTypingMsgId(replyId)
    let i = Math.min(40, replyText.length)
    setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: replyText.slice(0, i), timestamp: Date.now() }])
    if (i < replyText.length) {
      const iv = setInterval(() => {
        i = Math.min(i + 2, replyText.length)
        setMessages(prev => prev.map(m => m.id === replyId ? { ...m, content: replyText.slice(0, i) } : m))
        if (i >= replyText.length) { clearInterval(iv); setTypingMsgId(null) }
      }, 8)
    } else { setTypingMsgId(null) }
  }, [messages, scrollDuringTyping])

  // Hacking-vibe fallback titles for casual greetings
  const CASUAL_TITLES = [    'Just Vibing', 'Quick Chat', 'Hey Session', 'Casual Drop-in',
    'Just Checking In', 'Random Chat', 'Chill Session', 'Quick Hello',
    'Just Saying Hey', 'Friendly Check-in', 'Low-key Chat', 'Just Hanging',
  ]

  const generateChatTitle = useCallback(async (firstMessage: string, chatId: string) => {
    const isGreeting = /^(hey|hi|hello|sup|yo|hiya|howdy|what'?s up|how are you|thanks|ok|bye)[!?.]*$/i.test(firstMessage.trim())
    
    if (isGreeting) {
      const title = CASUAL_TITLES[Math.floor(Math.random() * CASUAL_TITLES.length)]
      setChatList(prev => prev.map(c => c.id === chatId ? { ...c, title } : c))
      setPageTitle(title)
      localStorage.setItem(getStorageKeys().pageTitle, title)
      return
    }

    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: firstMessage }),
      })
      const data = await res.json()
      const title = (data.title || firstMessage.slice(0, 30)).trim()
      setChatList(prev => prev.map(c => c.id === chatId ? { ...c, title } : c))
      setPageTitle(title)
      localStorage.setItem(getStorageKeys().pageTitle, title)
    } catch {
      const title = firstMessage.slice(0, 30)
      setChatList(prev => prev.map(c => c.id === chatId ? { ...c, title } : c))
      setPageTitle(title)
      localStorage.setItem(getStorageKeys().pageTitle, title)
    }
  }, [])

  const [chatLoadingOverlay, setChatLoadingOverlay] = useState(false)

  const handleSelectChat = useCallback((id: string) => {
    if (id === currentChatId) return
    setChatLoadingOverlay(true)
    setTimeout(() => {
      setCurrentChatId(id)
      
      // Check if this is a group chat
      const selectedChat = chatList.find(c => c.id === id)
      const isGroupChatId = selectedChat?.isGroup === true
      if (isGroupChatId) {
        setIsGroupChat(true)
        setGroupChatRoomId(id)
        // Load group chat name from chat list
        const groupChat = chatList.find(c => c.id === id)
        if (groupChat) {
          setGroupChatName(groupChat.title)
        }
      } else {
        setIsGroupChat(false)
        setGroupChatRoomId(null)
      }
      
      // Load stored messages for this chat
      const stored = chatStore[id]
      if (stored && stored.length > 0) {
        setMessages(stored)
        setChatActive(true)
      } else {
        setMessages([])
        setChatActive(false)
      }
      setSidebarOpen(false)
      setChatLoadingOverlay(false)
    }, 800)
  }, [currentChatId, chatStore, chatList])

  const handleRetry = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return
    // Remove only the last assistant message, keep user message
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant')
      if (idx === -1) return prev
      const realIdx = prev.length - 1 - idx
      return prev.filter((_, i) => i !== realIdx)
    })
    // Re-run inference with existing history (don't resend user message)
    setIsThinking(true)
    userScrolledRef.current = false
    setShowScrollBtn(false)

    const minDelay = new Promise(resolve => setTimeout(resolve, 2000))
    let replyText = "I'm having trouble connecting right now. Please check your internet connection and try again."

    try {
      const historyWithoutLastAssistant = messages.filter((_, i) => {
        const lastAssistantIdx = [...messages].map((m, idx) => m.role === 'assistant' ? idx : -1).filter(i => i !== -1).pop()
        return i !== lastAssistantIdx
      })
      const [res] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: lastUserMsg.content, history: historyWithoutLastAssistant.slice(0, -1) }),
        }),
        minDelay,
      ])
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.reply) replyText = data.reply
    } catch {
      await minDelay
    }

    setIsThinking(false)
    const replyId = (Date.now() + 1).toString()
    setTypingMsgId(replyId)
    setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: replyText.slice(0, 40), timestamp: Date.now() }])

    let i = 40
    if (i < replyText.length) {
      const typeInterval = setInterval(() => {
        i = Math.min(i + 2, replyText.length)
        setMessages(prev => prev.map(m => m.id === replyId ? { ...m, content: replyText.slice(0, i) } : m))
        scrollDuringTyping()
        if (i >= replyText.length) {
          clearInterval(typeInterval)
          setTypingMsgId(null)
          setTimeout(() => scrollDuringTyping(), 100)
        }
      }, 8)
    } else {
      setTypingMsgId(null)
    }
  }, [messages, scrollToBottom, scrollDuringTyping])

  const handleRegenerate = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant')
      if (idx === -1) return prev
      const realIdx = prev.length - 1 - idx
      return prev.filter((_, i) => i !== realIdx)
    })
    setIsThinking(true)
    userScrolledRef.current = false
    setShowScrollBtn(false)
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000))
    let replyText = "I'm having trouble connecting right now. Please check your internet connection and try again."
    try {
      const [res] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: lastUserMsg.content, history: messages.slice(0, -1) }),
        }),
        minDelay,
      ])
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.reply) replyText = data.reply
    } catch { await minDelay }
    setIsThinking(false)
    const replyId = (Date.now() + 1).toString()
    setTypingMsgId(replyId)
    setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: replyText.slice(0, 40), timestamp: Date.now() }])
    let i = 40
    if (i < replyText.length) {
      const typeInterval = setInterval(() => {
        i = Math.min(i + 2, replyText.length)
        setMessages(prev => prev.map(m => m.id === replyId ? { ...m, content: replyText.slice(0, i) } : m))
        scrollDuringTyping()
        if (i >= replyText.length) { clearInterval(typeInterval); setTypingMsgId(null); setTimeout(() => scrollDuringTyping(), 100) }
      }, 8)
    } else { setTypingMsgId(null) }
  }, [messages, scrollToBottom, scrollDuringTyping])

  const handleStop = useCallback(() => {
    stoppedRef.current = true
    // Abort any in-flight fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (isThinking) {
      // Still thinking — no text yet
      setIsThinking(false)
      setTypingMsgId(null)
      const stoppedId = (Date.now() + 1).toString()
      setMessages(prev => [...prev, {
        id: stoppedId,
        role: 'assistant',
        content: '*Stopped thinking*',
        timestamp: Date.now(),
      }])
    } else if (typingMsgId) {
      // Already typing — the interval will pick up stoppedRef and append the stopped line
    }
  }, [isThinking, typingMsgId])

  const startNewChat = useCallback(() => {
    if (!chatActive && messages.length === 0 && !isGroupChat) return
    setMessages([])
    setChatActive(false)
    setCurrentChatId(null)
    setInputValue('')
    setIsGhostMode(false)
    setIsGroupChat(false)
    setGroupChatRoomId(null)
    setGroupChatName('New group chat')
    setSplitViewUrl(null)
    setGreeting(randomGreeting())
    setNewChatKey(k => k + 1)
    setPageTitle('Helix')
    const keys = getStorageKeys()
    localStorage.removeItem(keys.messages)
    localStorage.removeItem(keys.pageTitle)
  }, [chatActive, messages.length, isGroupChat])

  // Wrapped setChatList that triggers new chat if current chat is removed
  const handleSetChatList: React.Dispatch<React.SetStateAction<ChatItem[]>> = useCallback((action) => {
    setChatList(prev => {
      const next = typeof action === 'function' ? action(prev) : action
      // If current chat no longer exists in the new list, go to new chat
      if (currentChatId && !next.find(c => c.id === currentChatId)) {
        setMessages([])
        setChatActive(false)
        setCurrentChatId(null)
        setInputValue('')
        setIsGhostMode(false)
        setGreeting(randomGreeting())
        setNewChatKey(k => k + 1)
        setPageTitle('Helix')
        localStorage.removeItem(getStorageKeys().messages)
      }
      return next
    })
  }, [currentChatId])

  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = useCallback(() => {
    setLoggingOut(true)
    const keys = getStorageKeys()
    localStorage.removeItem('helix_logged_in')
    localStorage.removeItem(keys.messages)
    localStorage.removeItem(keys.chatStore)
    localStorage.removeItem(keys.chatList)
    localStorage.removeItem('helix_greeting')
    setTimeout(() => { window.location.href = '/signup' }, 1200)
  }, [])

  const handleLogin = useCallback(() => {
    localStorage.setItem('helix_logged_in', 'true')
    setLoggedIn(true)
  }, [])

  const enterGhostMode = useCallback(() => {
    setIsGhostMode(true)
    setChatActive(false)
    setMessages([])
  }, [])

  const exitGhostMode = useCallback(() => {
    setIsGhostMode(false)
    setMessages([])
    setChatActive(false)
    setCurrentChatId(null)
    setGreeting(randomGreeting())
  }, [])

  const startGroupChat = useCallback(async () => {
    const defaultName = 'New group chat'
    
    // Create room on the WebSocket server first
    let roomId: string
    try {
      const { io } = await import('socket.io-client')
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168') || window.location.hostname.startsWith('172.'))
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
        (isLocalhost
          ? `http://${window.location.hostname}:8000`
          : `https://${window.location.hostname}`)
      const socket = io(wsUrl, { transports: ['websocket', 'polling'] })
      
      roomId = await new Promise<string>((resolve, reject) => {
        socket.on('connect', () => {
          socket.emit('create_room', (response: { roomId: string; inviteLink: string }) => {
            socket.disconnect()
            resolve(response.roomId)
          })
        })
        socket.on('connect_error', () => {
          socket.disconnect()
          // Fallback to local ID if server unreachable
          resolve(Date.now().toString(36) + Math.random().toString(36).substring(2, 8))
        })
        setTimeout(() => {
          socket.disconnect()
          resolve(Date.now().toString(36) + Math.random().toString(36).substring(2, 8))
        }, 3000)
      })
    } catch {
      roomId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
    }

    setIsGroupChat(true)
    setGroupChatRoomId(roomId)
    setGroupChatName(defaultName)
    setChatActive(false)
    setMessages([])
    setCurrentChatId(null)
    // Add to sidebar
    const newGroupChat: ChatItem = {
      id: roomId,
      title: defaultName,
      pinned: false,
      timestamp: Date.now(),
      isGroup: true,
    }
    setChatList(prev => [newGroupChat, ...prev])
  }, [])
  
  const handleGroupChatNameChange = useCallback((newName: string) => {
    setGroupChatName(newName)
    // Update in chat list
    if (groupChatRoomId) {
      setChatList(prev => prev.map(c => c.id === groupChatRoomId ? { ...c, title: newName } : c))
    }
  }, [groupChatRoomId])

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#141414', overflow: 'hidden', position: 'relative' }}>

      {/* Voice light at top center — only on home screen, desktop only */}
      {!chatActive && !isMobile && !isGroupChat && (
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', height: '70vh',
          background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}

      {/* Sidebar (logged in only) */}
      {loggedIn && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          chatList={chatList}
          setChatList={handleSetChatList}
          currentChatId={currentChatId}
          onNewChat={startNewChat}
          onSelectChat={(id) => handleSelectChat(id)}
          onLogout={handleLogout}
          onShareChat={() => setShareModalOpen(true)}
          onStartGroupChat={startGroupChat}
        />
      )}

      {/* Main chat area */}
      <div style={{ 
        flex: splitViewUrl ? '0 0 50%' : 1, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        overflow: 'hidden', 
        position: 'relative',
        transition: 'flex 0.3s ease',
      }}>

        {/* Landing navbar (logged out) */}
        {!loggedIn && <LandingNavbar onSignIn={handleLogin} />}

        {/* Top controls (logged in) */}
        {loggedIn && (
          <TopControls
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(o => !o)}
            onNewChat={startNewChat}
            onToggleGhost={() => isGhostMode ? exitGhostMode() : enterGhostMode()}
            isGhostMode={isGhostMode}
            chatActive={chatActive || isGroupChat}
            onShare={() => setShareModalOpen(true)}
            isGroupChat={isGroupChat}
            groupChatName={groupChatName}
            onGroupChatNameChange={handleGroupChatNameChange}
            splitViewOpen={!!splitViewUrl}
          />
        )}

        {/* Content area */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100%',
        }}>

          {/* Logged out — landing */}
          {!loggedIn && <LandingScreen loggedIn={false} />}

          {/* Learn Hacking — opens in new tab */}

          {/* Logged in — home screen (centered, input inline) */}
          {loggedIn && !chatActive && !isGhostMode && !isGroupChat && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: typeof window !== 'undefined' && window.innerWidth < 768 ? 25 : 28,
                width: '100%',
                maxWidth: 1200,
                padding: '0 20px',
              }}>
                <LandingScreen loggedIn={true} greeting={greeting} animateKey={newChatKey} />
                <InputSection
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={sendMessage}
                  chatMode={chatMode}
                  onChatModeChange={setChatMode}
                  isGhostMode={isGhostMode}
                  onStartGroupChat={startGroupChat}
                />
              </div>
            </div>
          )}

          {/* Ghost mode idle */}
          {loggedIn && isGhostMode && !chatActive && !isGroupChat && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 40,
                width: '100%',
                maxWidth: 1200,
                padding: '0 20px',
              }}>
                <GhostModeInfo />
                <InputSection
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={sendMessage}
                  chatMode={chatMode}
                  onChatModeChange={setChatMode}
                  isGhostMode={isGhostMode}
                  onStartGroupChat={startGroupChat}
                />
              </div>
            </div>
          )}

          {/* Group Chat Interface */}
          {loggedIn && isGroupChat && groupChatRoomId && (
            <GroupChatInterface
              roomId={groupChatRoomId}
              onBack={() => {
                setIsGroupChat(false)
                setGroupChatRoomId(null)
              }}
            />
          )}

          {/* Chat active — messages scroll, input fixed at bottom */}
          {loggedIn && chatActive && !isGroupChat && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', height: '100%' }}>
              {/* Scrollable messages */}
              <div
                ref={scrollContainerRef}
                onScroll={() => {
                  const el = scrollContainerRef.current
                  if (!el) return
                  const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
                  if (distFromBottom > 120) {
                    userScrolledRef.current = true
                    setShowScrollBtn(true)
                  } else {
                    userScrolledRef.current = false
                    setShowScrollBtn(false)
                  }
                }}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingBottom: 260,
                  paddingTop: 60,
                  paddingLeft: 'max(16px, calc((100% - 930px) / 2))',
                  paddingRight: 'max(16px, calc((100% - 930px) / 2))',
                  scrollbarWidth: 'none',
                }}>
                <ChatMessages
                  messages={messages}
                  isThinking={isThinking}
                  messagesEndRef={messagesEndRef}
                  typingMsgId={typingMsgId}
                  onRegenerate={handleRegenerate}
                />
              </div>

              {/* Input pinned at bottom using fixed positioning */}
              <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: splitViewUrl ? '50%' : 0,
                background: '#141414',
                padding: '8px 20px 0',
                zIndex: 20,
              }}>
                {/* Scroll to bottom button — sits above the input */}
                {showScrollBtn && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <button
                      onClick={forceScrollToBottom}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(30,30,30,0.95)',
                        color: '#ccc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.35)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#ccc' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                )}
                {/* Rate limit banner + input as one unit */}
                <div style={{ maxWidth: 910, margin: '0 auto', width: '100%' }}>
                  <InputSection
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={sendMessage}
                    chatMode={chatMode}
                    onChatModeChange={setChatMode}
                    isGhostMode={isGhostMode}
                    chatActive={chatActive}
                    isTyping={!!typingMsgId || isThinking}
                    onStop={handleStop}
                    rateLimited={isLimited}
                    agentPrompt={agentPrompt ? { actionType: agentPrompt.actionType } : null}
                    agentRunning={agentRunning}
                    onAgentExecute={() => agentPrompt && executeAgentAction(agentPrompt.actionType)}
                    onAgentExplain={() => { if (agentPrompt) { const m = agentPrompt.originalMessage; setAgentPrompt(null); sendExplain(m) } }}
                    onAgentDismiss={() => setAgentPrompt(null)}
                    onStartGroupChat={startGroupChat}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Landing footer (logged out) */}
        {!loggedIn && <LandingFooter />}
      </div>

      {/* Logout overlay */}
      {loggingOut && (
        <div style={{
          position: 'fixed', inset: 0, background: '#141414',
          zIndex: 99999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            width: 40, height: 40,
            border: '2px solid rgba(255,255,255,0.12)',
            borderTopColor: 'rgba(255,255,255,0.7)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ color: '#555', fontSize: 14, letterSpacing: '0.04em' }}>Logging out...</span>
        </div>
      )}

      {/* Chat loading overlay */}
      {chatLoadingOverlay && (
        <div style={{
          position: 'fixed', inset: 0, background: '#141414',
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 44, height: 44,
            border: '3px solid rgba(255,255,255,0.15)',
            borderTopColor: 'rgba(255,255,255,0.8)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      )}

      {/* Share modal */}
      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          messages={messages}
        />
      )}

      {/* Split view panel — opens on the right when a link is clicked */}
      {splitViewUrl && (
        <div style={{
          flex: '0 0 50%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid #2d2d2d',
          background: '#0f0f0f',
          position: 'relative',
          animation: 'slideInRight 0.25s ease',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid #2d2d2d',
            background: '#141414',
            gap: 10,
            flexShrink: 0,
          }}>
            {/* URL bar */}
            <div style={{
              flex: 1,
              background: '#1a1a1a',
              border: '1px solid #2d2d2d',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              color: '#888',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
            }}>
              {splitViewUrl}
            </div>
            {/* Open in new tab */}
            <button
              onClick={() => window.open(splitViewUrl, '_blank')}
              title="Open in new tab"
              style={{
                background: 'none', border: '1px solid #2d2d2d', borderRadius: 7,
                color: '#888', cursor: 'pointer', padding: '6px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#555' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = '#2d2d2d' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
            {/* Close */}
            <button
              onClick={() => setSplitViewUrl(null)}
              title="Close"
              style={{
                background: 'none', border: '1px solid #2d2d2d', borderRadius: 7,
                color: '#888', cursor: 'pointer', padding: '6px 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#555' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = '#2d2d2d' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* iframe */}
          <iframe
            src={splitViewUrl}
            style={{
              flex: 1,
              border: 'none',
              width: '100%',
              background: '#fff',
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Link preview"
          />
        </div>
      )}
    </div>
  )
}
