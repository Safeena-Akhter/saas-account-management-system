import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type { PublicUser, Session } from './types'

type ApiMessage = { message?: string }

// These three hit the Express backend directly via apiClient rather than
// going through NextAuth - forgot/reset happen before there's any session
// to speak of, and change-password's only NextAuth involvement is that
// apiClient's request interceptor already attaches the current session's
// accessToken automatically (see lib/api/client.ts), so there's nothing
// NextAuth-specific left to do here.

export function useForgotPassword() {
  return useMutation<{ message: string }, AxiosError<ApiMessage>, { email: string }>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', input)

      return data
    }
  })
}

export function useResetPassword() {
  return useMutation<{ message: string }, AxiosError<ApiMessage>, { token: string; password: string }>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ message: string }>('/auth/reset-password', input)

      return data
    }
  })
}

export function useChangePassword() {
  return useMutation<
    { message: string },
    AxiosError<ApiMessage>,
    { currentPassword: string; newPassword: string }
  >({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ message: string }>('/auth/change-password', input)

      return data
    }
  })
}

// ---------------------------------------------------------------------------
// Settings module: Profile, Preferences, Active Sessions. Every mutation
// below returns the same `PublicUser` shape the backend's toPublicUser()
// produces (see server/src/services/auth.service.ts) - callers pass that
// straight into NextAuth's `update()` (see libs/auth.ts's jwt callback) so
// the session reflects the change immediately, without forcing a
// logout/login round trip.
// ---------------------------------------------------------------------------

export function useUpdateProfile() {
  return useMutation<PublicUser, AxiosError<ApiMessage>, { name?: string; phone?: string }>({
    mutationFn: async input => {
      const { data } = await apiClient.patch<{ user: PublicUser }>('/auth/me', input)

      return data.user
    }
  })
}

export function useUploadAvatar() {
  return useMutation<PublicUser, AxiosError<ApiMessage>, File>({
    mutationFn: async file => {
      const formData = new FormData()

      formData.append('avatar', file)

      const { data } = await apiClient.post<{ user: PublicUser }>('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return data.user
    }
  })
}

export function useUpdatePreferences() {
  return useMutation<PublicUser, AxiosError<ApiMessage>, Partial<PublicUser['preferences']>>({
    mutationFn: async input => {
      const { data } = await apiClient.patch<{ user: PublicUser }>('/auth/me/preferences', input)

      return data.user
    }
  })
}

export function useSessions() {
  return useQuery<Session[], AxiosError<ApiMessage>>({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ sessions: Session[] }>('/auth/sessions')

      return data.sessions
    }
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation<void, AxiosError<ApiMessage>, string>({
    mutationFn: async id => {
      await apiClient.delete(`/auth/sessions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
    }
  })
}

// Logging out of every device necessarily includes the device that clicked
// the button - the caller (SessionsCard) follows this with next-auth's
// signOut(), same as UserDropdown's regular logout, since the current
// session's own refresh token cookie was just revoked server-side too.
export function useLogoutAllSessions() {
  return useMutation<{ message: string }, AxiosError<ApiMessage>, void>({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ message: string }>('/auth/logout-all')

      return data
    }
  })
}
