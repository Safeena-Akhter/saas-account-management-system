import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type { PlatformSettings, UpdatePlatformSettingsInput } from './types'

export const platformSettingsQueryKeys = {
  detail: ['platform-settings'] as const
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: platformSettingsQueryKeys.detail,
    queryFn: async () => {
      const { data } = await apiClient.get<{ settings: PlatformSettings }>('/platform/settings')

      return data.settings
    }
  })
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient()

  return useMutation<PlatformSettings, ApiError, UpdatePlatformSettingsInput>({
    mutationFn: async input => {
      const { data } = await apiClient.patch<{ settings: PlatformSettings }>('/platform/settings', input)

      return data.settings
    },
    onSuccess: settings => {
      queryClient.setQueryData(platformSettingsQueryKeys.detail, settings)
    }
  })
}
