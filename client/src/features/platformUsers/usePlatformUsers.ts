import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type { ListPlatformUsersParams, Pagination, PlatformUserListItem } from './types'

export const platformUserQueryKeys = {
  all: ['platform-users'] as const,
  list: (params: ListPlatformUsersParams = {}) => ['platform-users', 'list', params] as const,
  detail: (id: string) => ['platform-users', 'detail', id] as const
}

export function usePlatformUsers(params: ListPlatformUsersParams = {}) {
  return useQuery({
    queryKey: platformUserQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ users: PlatformUserListItem[]; pagination: Pagination }>(
        '/platform/users',
        { params }
      )

      return data
    }
  })
}

export function usePlatformUserDetails(id: string) {
  return useQuery({
    queryKey: platformUserQueryKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<{ user: PlatformUserListItem }>(`/platform/users/${id}`)

      return data.user
    },
    enabled: Boolean(id)
  })
}

// Shared by activate/deactivate below - both hit an intent-named endpoint
// (PATCH /:id/activate or /:id/deactivate), same pattern as
// usePlatformCompanies.ts's useSetCompanyActive.
function useSetUserActive(action: 'activate' | 'deactivate') {
  const queryClient = useQueryClient()

  return useMutation<{ user: PlatformUserListItem }, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<{ user: PlatformUserListItem }>(`/platform/users/${id}/${action}`)

      return data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: platformUserQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: platformUserQueryKeys.detail(id) })
    }
  })
}

export function useActivatePlatformUser() {
  return useSetUserActive('activate')
}

export function useDeactivatePlatformUser() {
  return useSetUserActive('deactivate')
}
