import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type { CreatePlanInput, Plan, UpdatePlanInput } from './types'

export const planQueryKeys = {
  all: ['plans'] as const,
  list: ['plans', 'list'] as const,
  active: ['plans', 'active'] as const
}

// Super Admin's plan-management screen - every plan, active or not.
export function usePlans() {
  return useQuery({
    queryKey: planQueryKeys.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ plans: Plan[] }>('/plans')

      return data.plans
    }
  })
}

// The pricing/upgrade screen every other role sees - active plans only.
// Separate query key (and separate GET /plans/active - see
// server/src/routes/plan.routes.ts) from usePlans() above since the two
// have different RBAC and deliberately different result sets.
export function useActivePlans() {
  return useQuery({
    queryKey: planQueryKeys.active,
    queryFn: async () => {
      const { data } = await apiClient.get<{ plans: Plan[] }>('/plans/active')

      return data.plans
    }
  })
}

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation<Plan, ApiError, CreatePlanInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ plan: Plan }>('/plans', input)

      return data.plan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.all })
    }
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation<Plan, ApiError, { id: string; input: UpdatePlanInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ plan: Plan }>(`/plans/${id}`, input)

      return data.plan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.all })
    }
  })
}

export function useSetPlanActive() {
  const queryClient = useQueryClient()

  return useMutation<Plan, ApiError, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) => {
      const { data } = await apiClient.patch<{ plan: Plan }>(`/plans/${id}/${isActive ? 'activate' : 'deactivate'}`)

      return data.plan
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.all })
    }
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/plans/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planQueryKeys.all })
    }
  })
}
