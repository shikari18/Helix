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
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'warn' | 'error' } | null>(null)
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
  const [showGroupActionModal, setShowGroupActionModal] = useState(false)
  const [modalView, setModalView] = useState<'choice' | 'join'>('choice')
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [agentSteps, setAgentSteps] = useState<{ id: string; label: string; status: 'thinking' | 'done' | 'error'; thought?: string }[]>([])

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

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const [plan, setPlan] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('helix_plan') || null
    return null
  })

  // Re-sync plan if localStorage changes (e.g. from pricing page)
  useEffect(() => {
    if (loggedIn && !plan && typeof window !== 'undefined' && !window.location.pathname.includes('/pricing')) {
        window.location.href = '/pricing'
    }
      const interval = setInterval(() => {
          const current = localStorage.getItem('helix_plan')
          if (current !== plan) setPlan(current as any)
      }, 1000)
      return () => clearInterval(interval)
  }, [plan, loggedIn])
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
  const lastScrollTimeRef = useRef(0)
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
    if (userScrolledRef.current || Date.now() - lastScrollTimeRef.current < 2000) return
    const el = scrollContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const scrollDuringTyping = useCallback(() => {
    if (userScrolledRef.current || Date.now() - lastScrollTimeRef.current < 2000) return
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
        ? "You've reached your daily limit on the **Free** plan. ⏳ Resets in **19 hours** — or [upgrade to Pro](/pricing) to keep going. 🔐"
        : plan === 'pro'
        ? "You've hit your **30 daily chats** on Pro. ⏳ Your limit resets in **19 hours** — or [upgrade to Pro+](/pricing) for more. 🔐"
        : "You've reached your daily limit on **Pro+**. ⏳ Resets in **19 hours** — or [upgrade to Ultra](/pricing) for unlimited access. 🔐"
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
        localStorage.removeItem('helix_logged_in')
        window.location.href = '/signup?blocked=1'
        return
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'API error');
      }
      const data = await res.json()
      if (data.reply) replyText = data.reply
    } catch (e: any) {
      if (e?.name === 'AbortError') return // stopped — already handled in handleStop
      
      // Attempt to extract detail from the failed response if possible
      try {
        if (e.message && e.message.includes('Backend service error')) {
           replyText = "The HELIX backend is currently overloaded or experiencing API issues. Please check your API keys or try again later. 🛠️"
        } else {
           replyText = `📡 Connection error: ${e.message || "Unknown error"}. Please check your internet or the backend status.`
        }
      } catch {}
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
            // Auto-execute if it's a direct system command (open_folder, open_app, wifi_scan)
            const autoExecTypes = ['wifi_scan', 'open_folder', 'open_app', 'system_command']
            if (autoExecTypes.includes(parsed.action_type)) {
              executeAgentAction(parsed.action_type, parsed.params || {})
              return
            }
            
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

  const executeAgentAction = useCallback(async (actionType: string, params: any = {}) => {
    setAgentPrompt(null)
    setAgentRunning(true)
    
    // Create initial step
    const stepId = Date.now().toString()
    let initialLabel = 'Starting task...'
    let thought = 'Initializing Helix Agent Core...'
    
    if (actionType === 'wifi_scan') {
      initialLabel = 'Scanning WiFi'
      thought = 'Accessing network adapter to enumerate nearby access points...'
    } else if (actionType === 'open_folder') {
      initialLabel = `Opening ${params.folder_name || 'folder'}`
      thought = 'Locating system path and triggering Windows Explorer...'
    } else if (actionType === 'open_app') {
      initialLabel = `Opening ${params.app_name || 'application'}`
      thought = 'Searching for application executable and initializing process...'
    }

    setAgentSteps([{ id: stepId, label: initialLabel, status: 'thinking', thought }])
    setChatActive(true)

    try {
      // Simulate thinking for a moment to show the thought process
      await new Promise(r => setTimeout(r, 1500))

      // Detect if running in Desktop App to route to local sidecar
      const isDesktop = typeof navigator !== 'undefined' && navigator.userAgent.includes('HelixDesktop')
      const agentBase = isDesktop ? 'http://localhost:8001' : ''
      
      if (!isDesktop && (actionType === 'wifi_scan' || actionType === 'open_folder' || actionType === 'open_app')) {
        setAgentSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'error', thought: 'Native features require the HELIX Desktop App.' } : s))
        setAgentRunning(false)
        return
      }

      const endpoint = actionType === 'wifi_scan' ? `${agentBase}/api/agent/wifi-scan` : `${agentBase}/api/agent/execute`
      const body = actionType === 'wifi_scan' ? {} : { action: actionType, params }
      
      const res = await fetch(endpoint, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (data.success || (actionType === 'wifi_scan' && data.count !== undefined)) {
        // Mark step as done
        setAgentSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'done' } : s))
        
        // Add final "done" message
        setTimeout(() => {
          setAgentSteps(prev => [...prev, { id: 'final', label: 'Done', status: 'done' }])
        }, 500)

        // Show result as a chat message after a delay
        setTimeout(() => {
          let resultText = data.details || 'Task completed successfully.'
          if (actionType === 'wifi_scan') {
             const nets = data.networks as any[]
             resultText = `📡 **Found ${data.count} WiFi networks**\n\n`
             resultText += `| SSID | Signal | Security |\n|---|---|---|\n`
             nets.slice(0, 5).forEach(n => resultText += `| ${n.ssid || '(Hidden)'} | ${n.signal} | ${n.security || '—'} |\n`)
          }
          const replyId = (Date.now() + 2).toString()
          setMessages(prev => [...prev, { id: replyId, role: 'assistant', content: resultText, timestamp: Date.now() }])
          setAgentSteps([]) // Clear steps
          setAgentRunning(false)
        }, 2000)

      } else {
        setAgentSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'error', thought: `Error: ${data.error}` } : s))
        setAgentRunning(false)
      }
    } catch (e) {
      setAgentSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'error', thought: 'Network or server error.' } : s))
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
  const CASUAL_TITLES = [
    'Casual Greeting', 'Quick Chat', 'Hey Session', 'Casual Drop-in',
    'Just Checking In', 'Random Chat', 'Greetings', 'Quick Hello',
    'Just Saying Hey', 'Friendly Check-in', 'Low-key Chat', 'Casual Vibe',
  ]

  const generateChatTitle = useCallback(async (firstMessage: string, chatId: string) => {
    const trimmed = firstMessage.trim().toLowerCase()
    const isGreeting = /^(hey|hi|hello|sup|yo|hiya|howdy|what'?s up|how are you|thanks|ok|bye)/i.test(trimmed)
    
    if (isGreeting && trimmed.split(' ').length < 6) {
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
      // If current group chat removed, reset group state
      if (groupChatRoomId && !next.find(c => c.id === groupChatRoomId)) {
        setIsGroupChat(false)
        setGroupChatRoomId(null)
        setMessages([])
      }
      return next
    })
  }, [currentChatId, groupChatRoomId])

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
      
      let wsUrl = ''
      try {
        const configRes = await fetch('/api/config')
        if (configRes.ok) {
          const config = await configRes.json()
          wsUrl = config.wsUrl
        }
      } catch (err) {
        console.error('Failed to fetch runtime config', err)
      }

      if (!wsUrl) {
         wsUrl = process.env.NEXT_PUBLIC_WS_URL || (isLocalhost
          ? `http://${window.location.hostname}:8000`
          : `https://${window.location.hostname}`)
      }
      
      if (!wsUrl.startsWith('http') && !wsUrl.startsWith('//')) {
         wsUrl = `https://${wsUrl}`
      }
      const socket = io(wsUrl, { transports: ['websocket', 'polling'], timeout: 10000 })
      
      roomId = await new Promise<string>((resolve, reject) => {
        socket.on('connect', () => {
          socket.emit('create_room', (response: { roomId: string; inviteLink: string }) => {
            socket.disconnect()
            resolve(response.roomId)
          })
        })
        socket.on('connect_error', () => {
          socket.disconnect()
          reject(new Error('Server unreachable'))
        })
        setTimeout(() => {
          socket.disconnect()
          reject(new Error('Connection timed out'))
        }, 5000)
      })
    } catch (err) {
      setToast({ msg: 'Group chat server is unreachable. Please try again later.', type: 'error' })
      return
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
  
  const joinGroupChat = useCallback(async (roomId: string) => {
    setIsGroupChat(true)
    setGroupChatRoomId(roomId)
    setGroupChatName(`Group ${roomId}`)
    setChatActive(false)
    setMessages([])
    setCurrentChatId(null)
    
    // Add to sidebar if not present
    const newGroup: ChatItem = {
      id: roomId,
      title: `Group ${roomId}`,
      pinned: false,
      timestamp: Date.now(),
      isGroup: true,
    }
    setChatList(prev => {
      if (prev.find(c => c.id === roomId)) return prev
      return [newGroup, ...prev]
    })
  }, [])

  // Expose to window for Sidebar
  useEffect(() => {
    (window as any).joinGroup = joinGroupChat
  }, [joinGroupChat])

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
          onOpenGroupMenu={() => setShowGroupActionModal(true)}
          isMobile={isMobile}
          plan={plan || 'free'}
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
                  isMobile={isMobile}
                  plan={plan || 'free'}
                  onToast={(msg, type) => setToast({ msg, type: type || 'info' })}
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
                  isMobile={isMobile}
                  plan={plan || 'free'}
                  onToast={(msg, type) => setToast({ msg, type: type || 'info' })}
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
                  if (distFromBottom > 80) {
                    userScrolledRef.current = true
                    lastScrollTimeRef.current = Date.now()
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
                  agentSteps={agentSteps}
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
                    isMobile={isMobile}
                    plan={plan || 'free'}
                    onToast={(msg, type) => setToast({ msg, type: type || 'info' })}
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
      {/* Group Action Modal — centered on screen */}
      {showGroupActionModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '90%', maxWidth: 400, background: '#1a1a1a', border: '1px solid #333',
            borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 20,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
          }}>
            <button 
              onClick={() => { setShowGroupActionModal(false); setModalView?.('choice') }}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#666', fontSize: 24, cursor: 'pointer' }}
            >×</button>

            {(modalView || 'choice') === 'choice' ? (
              <>
                <button
                  onClick={() => setModalView?.('join')}
                  style={{
                    width: '100%', height: 60, background: '#fff', color: '#000', fontWeight: 600,
                    borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16
                  }}
                >Join Room</button>
                <button
                  onClick={() => {
                    startGroupChat()
                    setShowGroupActionModal(false)
                  }}
                  style={{
                    width: '100%', height: 60, background: 'transparent', border: '1px solid #333',
                    color: '#fff', fontWeight: 600, borderRadius: 12, cursor: 'pointer', fontSize: 16
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#222')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >Create Room</button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                   <button onClick={() => setModalView?.('choice')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                   </button>
                   <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>Enter 6-digit Code</span>
                </div>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="000000"
                  maxLength={6}
                  value={joinRoomCode}
                  onChange={e => setJoinRoomCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%', height: 56, background: '#0f0f0f', border: '1px solid #333',
                    borderRadius: 12, padding: '0 16px', color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: '4px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  disabled={isSearching}
                  onClick={async () => {
                    if (joinRoomCode.length === 6) {
                      setIsSearching(true)
                      try {
                        const res = await fetch(`/api/rooms/${joinRoomCode}/exists`)
                        const data = await res.json()
                        
                        if (data.exists) {
                          // Room exists, proceed to join
                          joinGroupChat(joinRoomCode)
                          setShowGroupActionModal(false)
                          setJoinRoomCode('')
                          setModalView?.('choice')
                        } else {
                          setToast({ msg: 'Room not found. Check the code and try again.', type: 'error' })
                        }
                      } catch (e) {
                        setToast({ msg: 'Connection error. Please try again.', type: 'error' })
                      } finally {
                        setIsSearching(false)
                      }
                    } else {
                      setToast({ msg: 'Code must be 6 digits', type: 'error' })
                    }
                  }}
                  style={{
                    width: '100%', height: 50, background: '#fff', color: '#000', fontWeight: 600,
                    borderRadius: 12, border: 'none', cursor: isSearching ? 'not-allowed' : 'pointer',
                    opacity: isSearching ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  {isSearching ? 'Searching Room...' : 'Confirm Join'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
          padding: '12px 20px', zIndex: 10000, display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', animation: 'slideDown 0.3s ease'
        }}>
          {toast.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4d4d"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>}
          <span style={{ color: '#eee', fontSize: 14 }}>{toast.msg}</span>
        </div>
      )}
    </div>
  )
}
