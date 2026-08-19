import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type {
  AssignSubscriptionInput,
  ChangeMySubscriptionInput,
  CompanySubscription,
  MySubscription,
  SubscriptionStatus,
  UsageSummary
} from './types'

export const subscriptionQueryKeys = {
  all: ['subscriptions'] as const,
  mine: ['subscriptions', 'me'] as const,
  myUsage: ['subscriptions', 'me', 'usage'] as const,
  myHistory: ['subscriptions', 'me', 'history'] as const,
  allCompanies: ['subscriptions', 'list'] as const
}

// ---------------------------------------------------------------------------
// Business Owner (full) / Manager (view only) self-service - see
// SUBSCRIPTION_MODULE_VIEW_ROLES/WRITE_ROLES in server/src/constants/roles.ts.
// ---------------------------------------------------------------------------

// "View Current Plan" - null when the company somehow has no active
// subscription (shouldn't normally happen: every company gets the Free
// plan on signup - see server/src/services/auth.service.ts's register()).
export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionQueryKeys.mine,
    queryFn: async () => {
      const { data } = await apiClient.get<{ subscription: MySubscription | null }>('/subscriptions/me')

      return data.subscription
    }
  })
}

// "View Usage" - the progress bars under the plan card.
export function useMyUsage() {
  return useQuery({
    queryKey: subscriptionQueryKeys.myUsage,
    queryFn: async () => {
      const { data } = await apiClient.get<{ usage: UsageSummary | null }>('/subscriptions/me/usage')

      return data.usage
    }
  })
}

// "Subscription History".
export function useMySubscriptionHistory() {
  return useQuery({
    queryKey: subscriptionQueryKeys.myHistory,
    queryFn: async () => {
      const { data } = await apiClient.get<{ subscriptions: CompanySubscription[] }>('/subscriptions/me/history')

      return data.subscriptions
    }
  })
}

// Invalidated together by every mutation below - "me", "me/usage", and
// "me/history" all change together whenever the company's subscription
// changes (a new active row supersedes the old one, which now shows up in
// history too).
function invalidateMine(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all })
}

// "Upgrade Plan" / "Downgrade Plan" - same endpoint either direction, see
// server/src/services/subscription.service.ts's changeMySubscription.
export function useChangeMySubscription() {
  const queryClient = useQueryClient()

  return useMutation<CompanySubscription, ApiError, ChangeMySubscriptionInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ subscription: CompanySubscription }>('/subscriptions/me/change', input)

      return data.subscription
    },
    onSuccess: () => invalidateMine(queryClient)
  })
}

// "Renew Subscription".
export function useRenewMySubscription() {
  const queryClient = useQueryClient()

  return useMutation<CompanySubscription, ApiError, void>({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ subscription: CompanySubscription }>('/subscriptions/me/renew')

      return data.subscription
    },
    onSuccess: () => invalidateMine(queryClient)
  })
}

// "Cancel Subscription".
export function useCancelMySubscription() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await apiClient.post('/subscriptions/me/cancel')
    },
    onSuccess: () => invalidateMine(queryClient)
  })
}

// ---------------------------------------------------------------------------
// Super Admin - "View All Company Subscriptions" + "Assign Plan".
// ---------------------------------------------------------------------------

export function useAllSubscriptions(status?: SubscriptionStatus) {
  return useQuery({
    queryKey: [...subscriptionQueryKeys.allCompanies, status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ subscriptions: CompanySubscription[] }>('/subscriptions', {
        params: status ? { status } : undefined
      })

      return data.subscriptions
    }
  })
}

export function useAssignSubscription() {
  const queryClient = useQueryClient()

  return useMutation<CompanySubscription, ApiError, AssignSubscriptionInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ subscription: CompanySubscription }>('/subscriptions', input)

      return data.subscription
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.allCompanies })
    }
  })
}

export function useUpdateSubscriptionStatus() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, { id: string; status: SubscriptionStatus }>({
    mutationFn: async ({ id, status }) => {
      await apiClient.patch(`/subscriptions/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.allCompanies })
    }
  })
}
