import { useQuery } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { PlatformRevenueOverview } from './types'

export const platformRevenueQueryKeys = {
  overview: ['platform-revenue', 'overview'] as const
}

export function usePlatformRevenue() {
  return useQuery({
    queryKey: platformRevenueQueryKeys.overview,
    queryFn: async () => {
      const { data } = await apiClient.get<{ revenue: PlatformRevenueOverview }>('/platform/revenue')

      return data.revenue
    }
  })
}
