import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'

import apiClient from '@/lib/api/client'
import type { Company, CompanyDirectoryEntry, UpdateCompanyProfileInput } from './types'

export const companyQueryKeys = {
  me: ['company', 'me'] as const,
  directory: ['company', 'directory'] as const
}

export function useMyCompany() {
  return useQuery({
    queryKey: companyQueryKeys.me,
    queryFn: async () => {
      const { data } = await apiClient.get<{ company: Company }>('/companies/me')

      return data.company
    }
  })
}

export function useUpdateMyCompany() {
  const queryClient = useQueryClient()

  return useMutation<Company, AxiosError<{ message?: string }>, UpdateCompanyProfileInput>({
    mutationFn: async input => {
      const { data } = await apiClient.patch<{ company: Company }>('/companies/me', input)

      return data.company
    },
    onSuccess: company => {
      queryClient.setQueryData(companyQueryKeys.me, company)
    }
  })
}

// Uploads a logo file to the backend (which streams it to Cloudinary) and
// stores the resulting hosted URL as the company's logoUrl. Separate from
// useUpdateMyCompany because this one sends multipart/form-data, not JSON.
export function useUploadCompanyLogo() {
  const queryClient = useQueryClient()

  return useMutation<Company, AxiosError<{ message?: string }>, File>({
    mutationFn: async file => {
      const formData = new FormData()

      formData.append('logo', file)

      const { data } = await apiClient.post<{ company: Company }>('/companies/me/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return data.company
    },
    onSuccess: company => {
      queryClient.setQueryData(companyQueryKeys.me, company)
    }
  })
}

// Super Admin only - the minimal company picker used by the Subscription
// module's Assign Plan / Company Subscriptions screens. See
// server/src/repositories/company.repository.ts's findAllCompaniesDirectory
// for why this is deliberately narrow (id/name/isActive) rather than the
// full Company Management module.
export function useCompaniesDirectory(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: companyQueryKeys.directory,
    queryFn: async () => {
      const { data } = await apiClient.get<{ companies: CompanyDirectoryEntry[] }>('/companies/directory')

      return data.companies
    },
    enabled: options.enabled ?? true
  })
}
