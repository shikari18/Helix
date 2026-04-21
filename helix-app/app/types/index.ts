export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  timestamp: number
}

export interface ChatItem {
  id: string
  title: string
  pinned: boolean
  timestamp: number
}

export type AppMode = 'landing' | 'chat'
export type ChatMode = 'chat' | 'agent'
export type VoiceId = 'female' | 'male' | 'anime'

export interface Voice {
  id: VoiceId
  name: string
  tag: string
}
