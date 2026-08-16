import type { AppRole } from '@/utils/roleRoutes'

// Extends NextAuth's built-in types so `session.user.role`,
// `session.accessToken`, etc. are typed everywhere instead of needing `any`
// casts at every call site.
declare module 'next-auth' {
  interface Session {
    accessToken: string
    error?: 'RefreshAccessTokenError'
    user: {
      id: string
      name: string
      email: string
      role: AppRole
      companyId: string | null
      company: { id: string; name: string; logoUrl: string | null; currency: string } | null
      phone: string | null
      avatarUrl: string | null
      preferences: {
        theme: 'light' | 'dark' | 'system'
        language: 'en' | 'fr' | 'ar'
        dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
        currencyFormat: 'symbol' | 'code'
      }
      permissions: string[]
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: AppRole
    companyId: string | null
    company: { id: string; name: string; logoUrl: string | null; currency: string } | null
    phone: string | null
    avatarUrl: string | null
    preferences: {
      theme: 'light' | 'dark' | 'system'
      language: 'en' | 'fr' | 'ar'
      dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
      currencyFormat: 'symbol' | 'code'
    }
    permissions: string[]
    accessToken: string
    refreshToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: AppRole
    companyId: string | null
    company: { id: string; name: string; logoUrl: string | null; currency: string } | null
    phone: string | null
    avatarUrl: string | null
    preferences: {
      theme: 'light' | 'dark' | 'system'
      language: 'en' | 'fr' | 'ar'
      dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
      currencyFormat: 'symbol' | 'code'
    }
    permissions: string[]
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
    error?: 'RefreshAccessTokenError'
  }
}
