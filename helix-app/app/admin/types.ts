export interface UserRecord {
  email: string
  name: string
  plan: 'free' | 'pro' | 'proplus' | 'ultra'
  signedUpAt: string       // ISO 8601
  lastActiveAt: string     // ISO 8601
  messageCount: number
  loginCount: number
  blocked: boolean
  picture?: string
}

export interface AdminState {
  users: UserRecord[]
  loading: boolean
  selectedUser: UserRecord | null
  emailModal: { open: boolean; to: string; subject: string; body: string }
  searchQuery: string
  filterStatus: 'all' | 'active' | 'blocked'
}

export interface GetUsersResponse {
  users: UserRecord[]
}

export interface BlockRequest {
  email: string
}

export interface BlockResponse {
  success: boolean
  user: UserRecord
}

export interface UnblockRequest {
  email: string
}

export interface UnblockResponse {
  success: boolean
  user: UserRecord
}

export interface SendEmailRequest {
  to: string
  subject: string
  body: string
}

export interface SendEmailResponse {
  success: boolean
}

export interface UpdatePlanRequest {
  email: string
  plan: string
}

export interface UpdatePlanResponse {
  success: boolean
  user: UserRecord
}
