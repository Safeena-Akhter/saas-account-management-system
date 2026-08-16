import { useQuery } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type {
  AccountantDashboard,
  BusinessOwnerDashboard,
  EmployeeDashboard,
  ManagerDashboard,
  SuperAdminDashboard
} from './types'

export const dashboardQueryKeys = {
  mine: ['dashboard', 'me'] as const
}

// One backend endpoint (GET /dashboard) returns the shape appropriate to
// req.user.role - see dashboard.controller.ts. Each role-specific hook below
// just re-types the same query for the page that calls it, so a Business
// Owner page can't accidentally end up rendering Accountant fields.
function useDashboard<T>() {
  return useQuery({
    queryKey: dashboardQueryKeys.mine,
    queryFn: async () => {
      const { data } = await apiClient.get<{ dashboard: T }>('/dashboard')

      return data.dashboard
    }
  })
}

export const useBusinessOwnerDashboard = () => useDashboard<BusinessOwnerDashboard>()
export const useManagerDashboard = () => useDashboard<ManagerDashboard>()
export const useAccountantDashboard = () => useDashboard<AccountantDashboard>()
export const useEmployeeDashboard = () => useDashboard<EmployeeDashboard>()
export const useSuperAdminDashboard = () => useDashboard<SuperAdminDashboard>()
