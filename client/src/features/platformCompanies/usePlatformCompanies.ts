import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type {
  CompanyDetailsResponse,
  CompanyListItem,
  CompanyUserListItem,
  ListCompaniesParams,
  ListCompanyUsersParams,
  Pagination,
  UpdateCompanyInput
} from './types'

export const platformCompanyQueryKeys = {
  all: ['platform-companies'] as const,
  list: (params: ListCompaniesParams = {}) => ['platform-companies', 'list', params] as const,
  detail: (id: string) => ['platform-companies', 'detail', id] as const,
  users: (id: string, params: ListCompanyUsersParams = {}) => ['platform-companies', 'users', id, params] as const
}

export function usePlatformCompanies(params: ListCompaniesParams = {}) {
  return useQuery({
    queryKey: platformCompanyQueryKeys.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ companies: CompanyListItem[]; pagination: Pagination }>(
        '/platform/companies',
        { params }
      )

      return data
    }
  })
}

export function usePlatformCompanyDetails(id: string) {
  return useQuery({
    queryKey: platformCompanyQueryKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<CompanyDetailsResponse>(`/platform/companies/${id}`)

      return data
    },
    enabled: Boolean(id)
  })
}

export function usePlatformCompanyUsers(id: string, params: ListCompanyUsersParams = {}) {
  return useQuery({
    queryKey: platformCompanyQueryKeys.users(id, params),
    queryFn: async () => {
      const { data } = await apiClient.get<{ users: CompanyUserListItem[]; pagination: Pagination }>(
        `/platform/companies/${id}/users`,
        { params }
      )

      return data
    },
    enabled: Boolean(id)
  })
}

export function useUpdatePlatformCompany() {
  const queryClient = useQueryClient()

  return useMutation<CompanyDetailsResponse, ApiError, { id: string; input: UpdateCompanyInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<CompanyDetailsResponse>(`/platform/companies/${id}`, input)

      return data
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: platformCompanyQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: platformCompanyQueryKeys.detail(id) })
    }
  })
}

// Shared by suspend/activate below - both hit an intent-named endpoint
// (PATCH /:id/suspend or /:id/activate) rather than a generic
// isActive-toggling PATCH, matching plan.routes.ts's activate/deactivate
// pair.
function useSetCompanyActive(action: 'suspend' | 'activate') {
  const queryClient = useQueryClient()

  return useMutation<CompanyDetailsResponse, ApiError, string>({
    mutationFn: async id => {
      const { data } = await apiClient.patch<CompanyDetailsResponse>(`/platform/companies/${id}/${action}`)

      return data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: platformCompanyQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: platformCompanyQueryKeys.detail(id) })
    }
  })
}

export function useSuspendCompany() {
  return useSetCompanyActive('suspend')
}

export function useActivateCompany() {
  return useSetCompanyActive('activate')
}

export function useDeletePlatformCompany() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/platform/companies/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformCompanyQueryKeys.all })
    }
  })
}
