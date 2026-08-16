import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'

export type InvitationDetails = {
  name: string
  email: string
  role: 'BUSINESS_OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE'
  companyName: string
}

export type ApiError = AxiosError<{ message?: string }>

// Public endpoints - no session exists yet at this point, so these hit
// apiClient directly rather than going through anything NextAuth-aware.
export function useInvitation(token: string) {
  return useQuery<InvitationDetails, ApiError>({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data } = await apiClient.get<{ invitation: InvitationDetails }>(`/invitations/${token}`)

      return data.invitation
    },
    enabled: Boolean(token),
    // A token is either valid or it isn't right now - retrying a 400
    // (expired/invalid/already-used) just re-confirms the same rejection.
    retry: false
  })
}

export function useAcceptInvitation(token: string) {
  return useMutation<{ message: string }, ApiError, { password: string; confirmPassword: string }>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ message: string }>(`/invitations/${token}/accept`, input)

      return data
    }
  })
}
