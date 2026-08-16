import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiClient from '@/lib/api/client'
import type { ApiError } from '@/features/categories/useCategories'
import type { CreateProductInput, Product, UpdateProductInput } from './types'

export const productQueryKeys = {
  list: ['products'] as const
}

export function useProducts() {
  return useQuery({
    queryKey: productQueryKeys.list,
    queryFn: async () => {
      const { data } = await apiClient.get<{ products: Product[] }>('/products')

      return data.products
    }
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation<Product, ApiError, CreateProductInput>({
    mutationFn: async input => {
      const { data } = await apiClient.post<{ product: Product }>('/products', input)

      return data.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.list })
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation<Product, ApiError, { id: string; input: UpdateProductInput }>({
    mutationFn: async ({ id, input }) => {
      const { data } = await apiClient.patch<{ product: Product }>(`/products/${id}`, input)

      return data.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.list })
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: async id => {
      await apiClient.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.list })
    }
  })
}
