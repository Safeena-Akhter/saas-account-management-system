// Shared axios instance for talking to the Express/Prisma backend.
//
// Every feature's React Query hooks (useCustomers, useInvoices, ...) should
// import `apiClient` from here rather than creating their own axios
// instance, so auth headers, base URL, and error handling stay consistent
// in one place.

import axios, { type AxiosError } from 'axios'

import { getSession, signOut } from 'next-auth/react'

// NEXT_PUBLIC_API_URL must point at the Express backend, e.g.
// http://localhost:5000/api/v1 in development. This is intentionally
// different from the template's original API_URL, which pointed at
// Next.js's own (fake) /api routes - see .env.local.
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true
})

// Attach the backend JWT (stored on the NextAuth session, see
// src/libs/auth.ts from Phase 2 onward) to every outgoing request.
apiClient.interceptors.request.use(async config => {
  const session = await getSession()
  const accessToken = (session as any)?.accessToken

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

// A 401 from the backend means the access token is invalid/expired in a way
// NextAuth's own refresh cycle didn't catch - force a sign-out rather than
// letting the app sit in a broken, half-authenticated state.
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await signOut({ callbackUrl: '/login' })
    }

    return Promise.reject(error)
  }
)

export default apiClient
