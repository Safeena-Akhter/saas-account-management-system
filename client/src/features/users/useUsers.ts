import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type { CreateUserInput, ListUsersParams, UpdateUserInput, UsersPage } from './types'

export const userQueryKeys = {
  list: (params: ListUsersParams) => ['company-users', params] as const
}

export type ApiError = AxiosError<{ message?: string }>

const DEFAULT_PAGE_SIZE = 10

export function useCompanyUsers(params: ListUsersParams = {}) {
  const { search, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params

  return useQuery({
    queryKey: userQueryKeys.list({ search, page, pageSize }),
    queryFn: async () => {
      const { data } = await apiClient.get<UsersPage>('/users', {
        params: { search: search || undefined, page, pageSize }
      })

      return data
    },

    // Keeps the current page's rows on screen while the next page loads,
    // instead of flashing a loading skeleton on every click through search
    // results or pagination.
    placeholderData: keepPreviousData
  })
}

export function useCreateCompanyUser() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, CreateUserInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post('/users', input)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
    }
  })
}

export function useUpdateCompanyUser() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, { id: string; input: UpdateUserInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch(`/users/${id}`, input)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
    }
  })
}

// Separate from useUpdateCompanyUser (which can also toggle isActive) so the
// UI can call a single-purpose "Activate" / "Deactivate" action that hits
// the dedicated PATCH /users/:id/activate|deactivate endpoints, matching
// the backend's explicit activate/deactivate routes.
export function useActivateCompanyUser() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch(`/users/${id}/activate`)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
    }
  })
}

export function useDeactivateCompanyUser() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch(`/users/${id}/deactivate`)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
    }
  })
}

export function useDeleteCompanyUser() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
    }
  })
}

// Re-sends the invitation email with a fresh 24h token, invalidating
// whatever token was issued before (see the backend's issueInvitation,
// which always clears existing tokens first). Only valid for users who
// haven't accepted their original invite yet - the backend rejects this
// for anyone with emailVerifiedAt already set.
export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.post(`/users/${id}/resend-invitation`)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
    }
  })
}
