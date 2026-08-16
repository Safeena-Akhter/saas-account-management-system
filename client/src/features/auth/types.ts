// Mirrors the shape returned by server/src/services/auth.service.ts's
// toPublicUser() - the same shape comes back from /auth/login, /auth/me,
// /auth/refresh, and every Settings module mutation below (/auth/me,
// /auth/me/avatar, /auth/me/preferences), so a single type covers all of
// them.

export type UserPreferences = {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'fr' | 'ar'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

  // Display STYLE only ("symbol" -> "Rs2,000.00", "code" -> "PKR 2,000.00")
  // - never a different currency than the company's own. See
  // hooks/useCurrencyFormatter.ts, which combines this with
  // PublicUser.company.currency below.
  currencyFormat: 'symbol' | 'code'
}

export type PublicUser = {
  id: string
  name: string
  email: string
  role: string
  companyId: string | null
  company: { id: string; name: string; logoUrl: string | null; currency: string } | null
  phone: string | null
  avatarUrl: string | null
  preferences: UserPreferences
  permissions: string[]
}

// One row per active (non-revoked, non-expired) refresh token - see
// server/src/repositories/refreshToken.repository.ts's
// listActiveSessionsForUser. Deliberately has no `token` field: the backend
// never sends a live session's raw token value over the API (see
// auth.service.ts's listMySessions comment).
export type Session = {
  id: string
  userAgent: string | null
  ipAddress: string | null
  lastUsedAt: string | null
  createdAt: string
  isCurrent: boolean
}
