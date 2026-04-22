'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAdminAuth() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('helix_admin_auth')
      if (auth !== 'true') {
        router.replace('/admin/login')
      }
    }
  }, [router])
}
